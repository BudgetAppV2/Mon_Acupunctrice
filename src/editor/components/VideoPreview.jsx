import { useEffect, useCallback } from 'react'
import { Stage, Layer, Text } from 'react-konva'
import useEditorStore from '../store/useEditorStore.js'
import { useVideoPlayer } from '../hooks/useVideoPlayer.js'
import { formatTime } from '../utils/timeUtils.js'

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

  // Preview dimensions (fit in container, max 9:16 aspect)
  const previewWidth = 360
  const previewHeight = 640

  // Visible text overlays at current time
  const visibleOverlays = textOverlays.filter(
    o => currentTime >= o.startTime && currentTime <= o.endTime
  )

  // Current subtitle at current time
  const currentSubtitle = subtitlesVisible
    ? subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime)
    : null

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

            {/* Subtitle */}
            {currentSubtitle && (
              <Text
                text={currentSubtitle.text}
                x={previewWidth * 0.05}
                y={previewHeight * 0.85}
                width={previewWidth * 0.9}
                fontSize={22}
                fontFamily="Arial"
                fill="#FFFFFF"
                stroke="#000000"
                strokeWidth={2}
                align="center"
                listening={false}
              />
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
