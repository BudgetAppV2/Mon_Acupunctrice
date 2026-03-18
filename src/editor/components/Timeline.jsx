import { useRef, useEffect, useState } from 'react'
import useEditorStore from '../store/useEditorStore.js'
import { useVideoPlayer } from '../hooks/useVideoPlayer.js'
import { formatTime } from '../utils/timeUtils.js'
import TimelineTrack from './TimelineTrack.jsx'

const RULER_H = 20
const SLIDER_H = 32
const TOTAL_H = 80

export default function Timeline() {
  const videoDuration = useEditorStore(s => s.videoDuration)
  const currentTime = useEditorStore(s => s.currentTime)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const textOverlays = useEditorStore(s => s.textOverlays)
  const subtitles = useEditorStore(s => s.subtitles)
  const audioUrl = useEditorStore(s => s.audioUrl)
  const timelineZoom = useEditorStore(s => s.timelineZoom)

  const { seekTo } = useVideoPlayer()
  const containerRef = useRef(null)
  const [tracksH, setTracksH] = useState(TOTAL_H - RULER_H - SLIDER_H)

  // Measure and adapt tracks height on resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const h = el.offsetHeight
      setTracksH(Math.max(0, h - RULER_H - SLIDER_H))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!videoDuration) return null

  const duration = trimEnd || videoDuration
  const playheadPct = (currentTime / duration) * 100

  return (
    <div
      ref={containerRef}
      className="bg-gray-900 border-t border-gray-700"
      style={{ height: TOTAL_H, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Time ruler */}
      <div
        className="flex-shrink-0 px-4 flex items-center gap-2"
        style={{ height: RULER_H }}
      >
        <span className="text-xs text-gray-500 font-mono w-12">{formatTime(currentTime)}</span>
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500 font-mono w-12 text-right">{formatTime(duration)}</span>
      </div>

      {/* Tracks */}
      <div
        className="px-4 relative select-none"
        style={{
          height: tracksH,
          overflow: 'hidden',
          minWidth: `${100 * timelineZoom}%`,
        }}
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="w-3 h-3 bg-white rounded-full -ml-[5px] -mt-1" />
        </div>

        <TimelineTrack
          label="Vidéo"
          color="bg-sage-500"
          items={[{ start: trimStart, end: trimEnd, label: 'Vidéo' }]}
          duration={duration}
        />

        {audioUrl && (
          <TimelineTrack
            label="Audio"
            color="bg-purple-500"
            items={[{ start: 0, end: duration, label: 'Musique' }]}
            duration={duration}
          />
        )}

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

      {/* Slider seek */}
      <div
        className="flex-shrink-0 px-4 flex items-center bg-gray-800"
        style={{ height: SLIDER_H }}
      >
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onInput={(e) => seekTo(parseFloat(e.target.value))}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-white"
          style={{ margin: 0, padding: 0, height: 20 }}
        />
      </div>
    </div>
  )
}
