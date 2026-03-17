import { useRef, useCallback } from 'react'
import useEditorStore from '../store/useEditorStore.js'
import { useVideoPlayer } from '../hooks/useVideoPlayer.js'
import { formatTimePrecise, clamp } from '../utils/timeUtils.js'

export default function VideoTrimmer() {
  const trackRef = useRef(null)

  const videoDuration = useEditorStore(s => s.videoDuration)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const setTrimStart = useEditorStore(s => s.setTrimStart)
  const setTrimEnd = useEditorStore(s => s.setTrimEnd)
  const currentTime = useEditorStore(s => s.currentTime)

  const { seekTo } = useVideoPlayer()

  const trimDuration = trimEnd - trimStart

  // Convert mouse/touch X to time
  const xToTime = useCallback((clientX) => {
    if (!trackRef.current || !videoDuration) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    return ratio * videoDuration
  }, [videoDuration])

  // Drag handler factory
  const createDragHandler = useCallback((type) => {
    return (e) => {
      e.preventDefault()
      const isTouch = e.type === 'touchstart'

      const onMove = (moveEvent) => {
        const clientX = isTouch ? moveEvent.touches[0].clientX : moveEvent.clientX
        const time = xToTime(clientX)

        if (type === 'start') {
          const clamped = clamp(time, 0, trimEnd - 0.5)
          setTrimStart(clamped)
          seekTo(clamped)
        } else {
          const clamped = clamp(time, trimStart + 0.5, videoDuration)
          setTrimEnd(clamped)
        }
      }

      const onUp = () => {
        document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove)
        document.removeEventListener(isTouch ? 'touchend' : 'mouseup', onUp)
      }

      document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove)
      document.addEventListener(isTouch ? 'touchend' : 'mouseup', onUp)
    }
  }, [xToTime, trimStart, trimEnd, videoDuration, setTrimStart, setTrimEnd, seekTo])

  // Click on track to seek
  const handleTrackClick = (e) => {
    const time = xToTime(e.clientX)
    const clamped = clamp(time, trimStart, trimEnd)
    seekTo(clamped)
  }

  if (!videoDuration) return null

  const startPct = (trimStart / videoDuration) * 100
  const endPct = (trimEnd / videoDuration) * 100
  const currentPct = (currentTime / videoDuration) * 100

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">Trim</h3>
        <span className="text-xs text-gray-400 font-mono">
          Durée: {formatTimePrecise(trimDuration)}
        </span>
      </div>

      {/* Trim track */}
      <div
        ref={trackRef}
        className="relative h-12 bg-gray-700 rounded-lg cursor-pointer select-none touch-none"
        onClick={handleTrackClick}
      >
        {/* Excluded zones (dark overlay) */}
        <div
          className="absolute top-0 left-0 h-full bg-black/50 rounded-l-lg"
          style={{ width: `${startPct}%` }}
        />
        <div
          className="absolute top-0 right-0 h-full bg-black/50 rounded-r-lg"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Active zone highlight */}
        <div
          className="absolute top-0 h-full border-2 border-sage-400 rounded"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white z-10"
          style={{ left: `${currentPct}%` }}
        />

        {/* Start handle */}
        <div
          className="absolute top-0 h-full w-5 -ml-2.5 cursor-ew-resize z-20 flex items-center justify-center
                     touch-none"
          style={{ left: `${startPct}%` }}
          onMouseDown={createDragHandler('start')}
          onTouchStart={createDragHandler('start')}
        >
          <div className="w-1.5 h-8 bg-sage-400 rounded-full" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 h-full w-5 -ml-2.5 cursor-ew-resize z-20 flex items-center justify-center
                     touch-none"
          style={{ left: `${endPct}%` }}
          onMouseDown={createDragHandler('end')}
          onTouchStart={createDragHandler('end')}
        >
          <div className="w-1.5 h-8 bg-sage-400 rounded-full" />
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
        <span>{formatTimePrecise(trimStart)}</span>
        <span>{formatTimePrecise(trimEnd)}</span>
      </div>
    </div>
  )
}
