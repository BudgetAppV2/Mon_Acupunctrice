import { useRef, useEffect, useCallback } from 'react'
import useEditorStore from '../store/useEditorStore.js'

/**
 * Hook that syncs a <video> element with the editor store's playback state.
 * Returns a ref to attach to the video element.
 */
export function useVideoPlayer() {
  const videoRef = useRef(null)
  const animFrameRef = useRef(null)

  const isPlaying = useEditorStore(s => s.isPlaying)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const originalAudioVolume = useEditorStore(s => s.originalAudioVolume)
  const setCurrentTime = useEditorStore(s => s.setCurrentTime)
  const pause = useEditorStore(s => s.pause)

  // Sync volume with store
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = originalAudioVolume
  }, [originalAudioVolume])

  // Sync play/pause with store
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      // Ensure within trim bounds
      if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
        video.currentTime = trimStart
      }
      video.play().catch(() => {})

      // RAF loop to update currentTime in store
      const tick = () => {
        if (videoRef.current) {
          const t = videoRef.current.currentTime
          setCurrentTime(t)

          // Stop at trim end
          if (t >= trimEnd) {
            videoRef.current.pause()
            videoRef.current.currentTime = trimStart
            setCurrentTime(trimStart)
            pause()
            return
          }
        }
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      video.pause()
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, trimStart, trimEnd, setCurrentTime, pause])

  /**
   * Seek to a specific time
   */
  const seekTo = useCallback((time) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    setCurrentTime(time)
  }, [setCurrentTime])

  return { videoRef, seekTo }
}
