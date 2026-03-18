import { useRef, useCallback } from 'react'
import useEditorStore from '../store/useEditorStore.js'
import { useVideoPlayer } from '../hooks/useVideoPlayer.js'
import { formatTime, clamp } from '../utils/timeUtils.js'
import TimelineTrack from './TimelineTrack.jsx'

export default function Timeline() {
  const trackRef = useRef(null)

  const videoDuration = useEditorStore(s => s.videoDuration)
  const currentTime = useEditorStore(s => s.currentTime)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const textOverlays = useEditorStore(s => s.textOverlays)
  const subtitles = useEditorStore(s => s.subtitles)
  const audioUrl = useEditorStore(s => s.audioUrl)
  const timelineZoom = useEditorStore(s => s.timelineZoom)

  const { seekTo } = useVideoPlayer()

  if (!videoDuration) return null

  const duration = trimEnd || videoDuration
  const playheadPct = (currentTime / duration) * 100

  // Click to seek
  const handleClick = (e) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const time = ratio * duration
    seekTo(clamp(time, trimStart, trimEnd))
  }

  return (
    <div className="bg-gray-900 border-t border-gray-700">
      {/* Time ruler */}
      <div className="px-4 pt-2 flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono w-12">{formatTime(currentTime)}</span>
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500 font-mono w-12 text-right">{formatTime(duration)}</span>
      </div>

      {/* Tracks container */}
      <div
        ref={trackRef}
        className="relative px-4 pb-3 pt-1 cursor-pointer select-none"
        onClick={handleClick}
        style={{ minWidth: `${100 * timelineZoom}%` }}
      >
        {/* Transparent range slider for drag & touch seeking */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={(e) => seekTo(clamp(parseFloat(e.target.value), trimStart, trimEnd))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          style={{ height: '100%', margin: 0, padding: '0 16px' }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
          style={{ left: `calc(${playheadPct}% + 16px)` }}
        >
          <div className="w-3 h-3 bg-white rounded-full -ml-[5px] -mt-1" />
        </div>

        {/* Video track */}
        <TimelineTrack
          label="Vidéo"
          color="bg-sage-500"
          items={[{ start: trimStart, end: trimEnd, label: 'Vidéo' }]}
          duration={duration}
        />

        {/* Audio track (if audio imported) */}
        {audioUrl && (
          <TimelineTrack
            label="Audio"
            color="bg-purple-500"
            items={[{ start: 0, end: duration, label: 'Musique' }]}
            duration={duration}
          />
        )}

        {/* Subtitle track */}
        {subtitles.length > 0 && (
          <TimelineTrack
            label="Subs"
            color="bg-yellow-500"
            items={subtitles.map(s => ({
              start: s.startTime,
              end: s.endTime,
              label: s.text.slice(0, 20),
            }))}
            duration={duration}
          />
        )}

        {/* Text overlay track */}
        {textOverlays.length > 0 && (
          <TimelineTrack
            label="Texte"
            color="bg-blue-500"
            items={textOverlays.map(o => ({
              start: o.startTime,
              end: o.endTime,
              label: o.text.slice(0, 20),
            }))}
            duration={duration}
          />
        )}
      </div>
    </div>
  )
}
