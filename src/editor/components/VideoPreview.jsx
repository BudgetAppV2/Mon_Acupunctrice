import { useEffect, useState, useCallback, useMemo } from 'react'
import { Stage, Layer, Text, Rect, Group } from 'react-konva'
import useEditorStore from '../store/useEditorStore.js'
import { useVideoPlayer } from '../hooks/useVideoPlayer.js'
import { formatTime } from '../utils/timeUtils.js'
import { SUBTITLE_STYLES } from '../utils/subtitleStyles.js'

function useResponsivePreview() {
  const [dims, setDims] = useState(() => calcDims())

  function calcDims() {
    const isMobile = window.innerWidth < 1024
    if (isMobile) {
      // Mobile: fit within 38vh, maintain 9:16 aspect
      const maxH = Math.min(360, window.innerHeight * 0.38)
      const h = Math.round(maxH)
      const w = Math.round(h * 9 / 16)
      return { width: w, height: h }
    }
    return { width: 360, height: 640 }
  }

  useEffect(() => {
    const onResize = () => setDims(calcDims())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return dims
}

export default function VideoPreview() {
  const { videoRef, seekTo } = useVideoPlayer()

  const videoUrl = useEditorStore(s => s.videoUrl)
  const currentTime = useEditorStore(s => s.currentTime)
  const isPlaying = useEditorStore(s => s.isPlaying)
  const togglePlay = useEditorStore(s => s.togglePlay)
  const setVideoDimensions = useEditorStore(s => s.setVideoDimensions)
  const videoDuration = useEditorStore(s => s.videoDuration)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const textOverlays = useEditorStore(s => s.textOverlays)
  const subtitles = useEditorStore(s => s.subtitles)
  const subtitlesVisible = useEditorStore(s => s.subtitlesVisible)
  const subtitleStyle = useEditorStore(s => s.subtitleStyle)
  const subtitleConfig = useEditorStore(s => s.subtitleConfig)
  const setSubtitleConfig = useEditorStore(s => s.setSubtitleConfig)
  const selectedOverlayId = useEditorStore(s => s.selectedOverlayId)
  const updateTextOverlay = useEditorStore(s => s.updateTextOverlay)
  const selectOverlay = useEditorStore(s => s.selectOverlay)
  const deselectOverlay = useEditorStore(s => s.deselectOverlay)

  // When video metadata loads, store dimensions
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setVideoDimensions(video.videoWidth, video.videoHeight, video.duration)
  }, [videoRef, setVideoDimensions])

  // Responsive preview dimensions — 9:16 aspect, capped on mobile
  const { width: previewWidth, height: previewHeight } = useResponsivePreview()

  // Visible text overlays at current time
  const visibleOverlays = textOverlays.filter(
    o => currentTime >= o.startTime && currentTime <= o.endTime
  )

  // Get current style config
  const styleConfig = SUBTITLE_STYLES[subtitleStyle] || SUBTITLE_STYLES.classic

  // Find the current subtitle group at this time
  const currentSubtitle = subtitlesVisible
    ? subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime)
    : null

  // For animated styles, find which word within the group is active
  const activeWordIndex = useMemo(() => {
    if (!currentSubtitle?.words?.length || !styleConfig.animated) return -1
    for (let i = currentSubtitle.words.length - 1; i >= 0; i--) {
      if (currentTime >= currentSubtitle.words[i].start) return i
    }
    return -1
  }, [currentSubtitle, currentTime, styleConfig.animated])

  // Subtitle position from config
  const subX = (subtitleConfig?.x ?? 0.5) * previewWidth
  const subY = (subtitleConfig?.y ?? 0.85) * previewHeight
  const subFontSize = (subtitleConfig?.fontSize ?? styleConfig.fontSize) * (previewWidth / 1080)

  return (
    <div className="relative flex flex-col items-center">
      {/* Video container */}
      <div
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ width: previewWidth, height: previewHeight }}
      >
        {/* Video element */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
            onClick={togglePlay}
          />
        )}

        {/* Konva overlay for text and subtitles */}
        <Stage
          width={previewWidth}
          height={previewHeight}
          className="absolute inset-0 pointer-events-auto"
          onClick={(e) => {
            // Click on empty stage = deselect
            if (e.target === e.target.getStage()) {
              deselectOverlay()
            }
          }}
        >
          <Layer>
            {/* Text overlays */}
            {visibleOverlays.map(overlay => (
              <Text
                key={overlay.id}
                text={overlay.text}
                x={overlay.x * previewWidth}
                y={overlay.y * previewHeight}
                fontSize={overlay.fontSize * (previewWidth / 1080)}
                fontFamily={overlay.fontFamily || 'Arial'}
                fill={overlay.color || '#FFFFFF'}
                stroke="#000000"
                strokeWidth={1}
                draggable
                onClick={() => selectOverlay(overlay.id)}
                onTap={() => selectOverlay(overlay.id)}
                onDragEnd={(e) => {
                  updateTextOverlay(overlay.id, {
                    x: e.target.x() / previewWidth,
                    y: e.target.y() / previewHeight,
                  })
                }}
                opacity={selectedOverlayId === overlay.id ? 1 : 0.9}
                shadowColor={selectedOverlayId === overlay.id ? '#4ade80' : undefined}
                shadowBlur={selectedOverlayId === overlay.id ? 10 : 0}
              />
            ))}

            {/* Subtitle — classic (static, no word highlight) */}
            {currentSubtitle && !styleConfig.animated && (
              <Text
                text={currentSubtitle.text}
                x={subX - previewWidth * 0.45}
                y={subY}
                width={previewWidth * 0.9}
                fontSize={subFontSize}
                fontFamily={styleConfig.fontFamily || 'Arial'}
                fontStyle={styleConfig.fontWeight || 'bold'}
                fill={styleConfig.color || '#FFFFFF'}
                stroke={styleConfig.strokeColor || '#000000'}
                strokeWidth={(styleConfig.strokeWidth || 3) * (previewWidth / 1080)}
                align="center"
                draggable
                onDragEnd={(e) => {
                  setSubtitleConfig({
                    x: (e.target.x() + previewWidth * 0.45) / previewWidth,
                    y: e.target.y() / previewHeight,
                  })
                }}
              />
            )}

            {/* Subtitle — animated (TikTok / Karaoke word-by-word within group) */}
            {currentSubtitle && styleConfig.animated && (
              <Group
                x={0}
                y={subY}
                draggable
                onDragEnd={(e) => {
                  setSubtitleConfig({
                    y: e.target.y() / previewHeight,
                  })
                }}
              >
                {/* Background for karaoke style */}
                {styleConfig.backgroundColor && (
                  <Rect
                    x={previewWidth * 0.05}
                    y={-4}
                    width={previewWidth * 0.9}
                    height={subFontSize + 12}
                    fill={styleConfig.backgroundColor}
                    cornerRadius={6}
                  />
                )}
                {/* Render each word in the group */}
                {(() => {
                  const words = currentSubtitle.words || []
                  if (!words.length) {
                    // No word-level data — render full text
                    return (
                      <Text
                        text={currentSubtitle.text}
                        x={previewWidth * 0.05}
                        y={0}
                        width={previewWidth * 0.9}
                        fontSize={subFontSize}
                        fontFamily={styleConfig.fontFamily}
                        fontStyle={styleConfig.fontWeight}
                        fill={styleConfig.color}
                        align="center"
                        listening={false}
                      />
                    )
                  }

                  // Approximate char width for centering
                  const charWidth = subFontSize * 0.55
                  const fullText = words.map(w => w.word).join(' ')
                  const totalWidth = fullText.length * charWidth
                  let x = (previewWidth - totalWidth) / 2
                  const scale = previewWidth / 1080

                  return words.map((w, i) => {
                    const isActive = i <= activeWordIndex
                    const wordText = i < words.length - 1 ? w.word + ' ' : w.word
                    const wordWidth = wordText.length * charWidth
                    const node = (
                      <Text
                        key={i}
                        text={wordText}
                        x={x}
                        y={0}
                        fontSize={subFontSize}
                        fontFamily={styleConfig.fontFamily}
                        fontStyle={styleConfig.fontWeight}
                        fill={isActive ? styleConfig.activeColor : styleConfig.color}
                        stroke={styleConfig.strokeWidth > 0 ? styleConfig.strokeColor : undefined}
                        strokeWidth={styleConfig.strokeWidth > 0 ? styleConfig.strokeWidth * scale : 0}
                        listening={false}
                      />
                    )
                    x += wordWidth
                    return node
                  })
                })()}
              </Group>
            )}
          </Layer>
        </Stage>

        {/* Play/pause overlay */}
        {!isPlaying && videoUrl && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity
                       hover:bg-black/30"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {/* No video placeholder */}
        {!videoUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <span className="text-4xl mb-2">🎬</span>
            <p className="text-sm">Importe une vidéo pour commencer</p>
          </div>
        )}
      </div>

      {/* Time display */}
      {videoUrl && (
        <div className="mt-2 text-xs text-gray-400 font-mono">
          {formatTime(currentTime)} / {formatTime(trimEnd || videoDuration)}
        </div>
      )}
    </div>
  )
}
