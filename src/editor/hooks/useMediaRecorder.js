import { useState, useRef, useCallback } from 'react'

/**
 * Hook for webcam and screen recording via MediaRecorder API.
 */
export function useMediaRecorder() {
  const [recording, setRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  /**
   * Start webcam stream (preview only, not recording yet)
   */
  const startWebcam = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
      audio: true,
    })
    setStream(mediaStream)
    return mediaStream
  }, [])

  /**
   * Start screen capture stream
   */
  const startScreen = useCallback(async () => {
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    })
    setStream(mediaStream)
    return mediaStream
  }, [])

  /**
   * Begin recording from the current stream with 3-2-1 countdown
   * @returns {Promise<{file: File, url: string}>}
   */
  const startRecording = useCallback((activeStream) => {
    return new Promise((resolve, reject) => {
      const s = activeStream || stream
      if (!s) return reject(new Error('No active stream'))

      chunksRef.current = []

      // 3-2-1 countdown
      let count = 3
      setCountdown(count)
      const interval = setInterval(() => {
        count--
        if (count > 0) {
          setCountdown(count)
        } else {
          clearInterval(interval)
          setCountdown(null)

          // Start recording
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm'

          const recorder = new MediaRecorder(s, { mimeType })
          mediaRecorderRef.current = recorder

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
          }

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType })
            const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType })
            const url = URL.createObjectURL(blob)
            setRecording(false)
            resolve({ file, url })
          }

          recorder.onerror = (e) => {
            setRecording(false)
            reject(e.error || new Error('Recording error'))
          }

          recorder.start(1000) // Collect in 1s chunks
          setRecording(true)
        }
      }, 1000)
    })
  }, [stream])

  /**
   * Stop the current recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  /**
   * Stop all media tracks and clean up
   */
  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setRecording(false)
    setCountdown(null)
  }, [stream])

  return {
    recording,
    stream,
    countdown,
    startWebcam,
    startScreen,
    startRecording,
    stopRecording,
    cleanup,
  }
}
