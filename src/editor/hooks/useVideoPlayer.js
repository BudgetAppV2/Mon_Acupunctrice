import { useRef, useEffect, useCallback } from 'react'
import useEditorStore from '../store/useEditorStore.js'

/**
 * Hook that syncs a <video> element with the editor store's playback state.
 * Returns a ref to attach to the video element.
 */
export function useVideoPlayer() {
  const videoRef = useRef(null)
  const audioRef = useRef(null) // For imported music playback
  const animFrameRef = useRef(null)

  const isPlaying = useEditorStore(s => s.isPlaying)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const originalAudioVolume = useEditorStore(s => s.originalAudioVolume)
  const audioUrl = useEditorStore(s => s.audioUrl)
  const audioVolume = useEditorStore(s => s.audioVolume)
  const seekRequest = useEditorStore(s => s._seekRequest)
  const setCurrentTime = useEditorStore(s => s.setCurrentTime)
  const pause = useEditorStore(s => s.pause)

  // React to seekTo() calls from the store
  useEffect(() => {
    if (seekRequest === undefined || seekRequest === null) return
    if (videoRef.current) {
      videoRef.current.currentTime = seekRequest
      setCurrentTime(seekRequest)
      console.log('[useVideoPlayer] seekRequest applied:', seekRequest)
    }
    if (audioRef.current) audioRef.current.currentTime = seekRequest
  }, [seekRequest])

  // Create/update audio element for imported music
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      return
    }
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    audioRef.current.src = audioUrl
    audioRef.current.volume = audioVolume
    audioRef.current.load()
    console.log('[useVideoPlayer] Audio element created for:', audioUrl.slice(0, 60))
  }, [audioUrl])

  // Sync music volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = audioVolume
  }, [audioVolume])

  // Sync video volume with store
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
        if (audioRef.current) audioRef.current.currentTime = 0
      }
      video.play().catch(() => {})
      // Play imported music in sync
      if (audioRef.current) {
        audioRef.current.play().catch(() => {})
        console.log('[useVideoPlayer] Music playing')
      }

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
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
            pause()
            return
          }
        }
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      video.pause()
      if (audioRef.current) audioRef.current.pause()
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
    console.log('[seekTo] called with:', time, 'video:', !!video, 'readyState:', video?.readyState)
    if (!video) return
    video.currentTime = time
    if (audioRef.current) audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [setCurrentTime])

  return { videoRef, seekTo }
}
