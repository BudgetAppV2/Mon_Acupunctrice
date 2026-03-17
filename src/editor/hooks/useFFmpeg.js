import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

/**
 * Hook for FFmpeg.wasm initialization and command execution.
 * Uses @ffmpeg/ffmpeg 0.12.x CoreFFmpeg API.
 */
export function useFFmpeg() {
  const ffmpegRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (ffmpegRef.current && loaded) return ffmpegRef.current
    if (loading) return null

    setLoading(true)
    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      setLoaded(true)
      return ffmpeg
    } catch (err) {
      console.error('FFmpeg load error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loaded, loading])

  /**
   * Write a file to FFmpeg's virtual filesystem
   */
  const writeFile = useCallback(async (name, data) => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg) throw new Error('FFmpeg not loaded')

    if (data instanceof File || data instanceof Blob) {
      const buffer = await fetchFile(data)
      await ffmpeg.writeFile(name, buffer)
    } else if (typeof data === 'string') {
      const encoder = new TextEncoder()
      await ffmpeg.writeFile(name, encoder.encode(data))
    } else {
      await ffmpeg.writeFile(name, data)
    }
  }, [])

  /**
   * Read a file from FFmpeg's virtual filesystem
   */
  const readFile = useCallback(async (name) => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg) throw new Error('FFmpeg not loaded')
    return await ffmpeg.readFile(name)
  }, [])

  /**
   * Execute an FFmpeg command
   * @param {string[]} args - command arguments
   * @param {function} onProgress - progress callback (0-100)
   */
  const exec = useCallback(async (args, onProgress) => {
    const ffmpeg = ffmpegRef.current
    if (!ffmpeg) throw new Error('FFmpeg not loaded')

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100))
      })
    }

    await ffmpeg.exec(args)

    if (onProgress) {
      ffmpeg.off('progress')
    }
  }, [])

  return {
    load,
    loaded,
    loading,
    writeFile,
    readFile,
    exec,
    ffmpeg: ffmpegRef.current,
  }
}
