/**
 * WebCodecs + mediabunny export pipeline
 * Hardware-accelerated video encoding — 10-50x faster than FFmpeg.wasm
 *
 * Pipeline:
 * 1. Render video frames + overlays on OffscreenCanvas
 * 2. CanvasSource captures & encodes frames (H.264 hardware)
 * 3. Mix audio → OfflineAudioContext → AudioBufferSource encodes (AAC)
 * 4. Output muxes video + audio → MP4 (BufferTarget)
 */
import { Output, BufferTarget, Mp4OutputFormat, CanvasSource, AudioBufferSource } from 'mediabunny'
import { SUBTITLE_STYLES, generateTikTokPages, getActivePageAndToken, drawAnimatedSubtitle } from './subtitleStyles.js'

/**
 * Check if WebCodecs is available and supports H.264 encoding
 */
export async function isWebCodecsSupported() {
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') {
    return false
  }
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec: 'avc1.42001f', // H.264 Baseline
      width: 1080,
      height: 1920,
      bitrate: 4_000_000,
    })
    return support.supported === true
  } catch {
    return false
  }
}

/**
 * Export video using WebCodecs + mediabunny
 *
 * @param {Object} params
 * @param {Blob|string} params.videoSource - Video blob or URL
 * @param {number} params.trimStart - Trim start in seconds
 * @param {number} params.trimEnd - Trim end in seconds
 * @param {Array} params.textOverlays - Text overlay objects
 * @param {Array} params.subtitles - Subtitle objects
 * @param {string} params.subtitleStyle - Style preset key ('classic'|'tiktok'|'karaoke')
 * @param {Blob|null} params.audioFile - Optional audio file to mix
 * @param {number} params.audioVolume - Audio track volume (0-1)
 * @param {number} params.originalVolume - Original audio volume (0-1)
 * @param {Object} params.outputSize - { width, height }
 * @param {Function} params.onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} Encoded MP4 blob
 */
export async function exportWithWebCodecs({
  videoSource,
  trimStart = 0,
  trimEnd,
  textOverlays = [],
  subtitles = [],
  subtitleStyle = 'classic',
  audioFile = null,
  audioVolume = 0.5,
  originalVolume = 1,
  outputSize = { width: 1080, height: 1920 },
  onProgress = () => {},
}) {
  // 1. Load source video into a <video> element for frame extraction
  const videoEl = document.createElement('video')
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.preload = 'auto'

  const videoBlob = videoSource instanceof Blob
    ? videoSource
    : await fetch(videoSource).then(r => r.blob())

  const videoUrl = URL.createObjectURL(videoBlob)
  videoEl.src = videoUrl

  await new Promise((resolve, reject) => {
    videoEl.onloadedmetadata = resolve
    videoEl.onerror = reject
  })

  const sourceDuration = videoEl.duration
  const effectiveEnd = trimEnd || sourceDuration
  const duration = effectiveEnd - trimStart
  const sourceWidth = videoEl.videoWidth
  const sourceHeight = videoEl.videoHeight
  const fps = 30
  const totalFrames = Math.ceil(duration * fps)

  onProgress(5)

  // 2. Setup OffscreenCanvas for rendering
  const canvas = new OffscreenCanvas(outputSize.width, outputSize.height)
  const ctx = canvas.getContext('2d')

  // 3. Setup mediabunny Output with CanvasSource + AudioBufferSource
  const target = new BufferTarget()
  const videoSrc = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: 4_000_000,
    keyFrameInterval: 2,
    hardwareAcceleration: 'prefer-hardware',
  })

  const audioSrc = new AudioBufferSource({
    codec: 'aac',
    bitrate: 128_000,
  })

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  })

  output.addVideoTrack(videoSrc, { frameRate: fps })
  output.addAudioTrack(audioSrc)
  await output.start()

  // 4. Pre-compute TikTok pages for animated subtitles
  const styleConfig = SUBTITLE_STYLES[subtitleStyle] || SUBTITLE_STYLES.classic
  const tikTokPages = styleConfig.animated ? generateTikTokPages(subtitles) : []

  // 5. Extract and encode frames
  for (let i = 0; i < totalFrames; i++) {
    const time = trimStart + (i / fps)
    videoEl.currentTime = time

    await new Promise((resolve) => {
      videoEl.onseeked = resolve
    })

    // Draw video frame scaled to output size
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, outputSize.width, outputSize.height)

    // Calculate fit dimensions (contain)
    const scaleX = outputSize.width / sourceWidth
    const scaleY = outputSize.height / sourceHeight
    const scale = Math.min(scaleX, scaleY)
    const drawWidth = sourceWidth * scale
    const drawHeight = sourceHeight * scale
    const offsetX = (outputSize.width - drawWidth) / 2
    const offsetY = (outputSize.height - drawHeight) / 2

    ctx.drawImage(videoEl, offsetX, offsetY, drawWidth, drawHeight)

    // Draw text overlays
    for (const overlay of textOverlays) {
      if (time >= overlay.startTime && time <= overlay.endTime) {
        const fontSize = overlay.fontSize * (outputSize.width / 1080)
        ctx.font = `${fontSize}px ${overlay.fontFamily || 'Arial'}`
        ctx.fillStyle = overlay.color || '#FFFFFF'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        const x = overlay.x * outputSize.width
        const y = overlay.y * outputSize.height
        ctx.strokeText(overlay.text, x, y)
        ctx.fillText(overlay.text, x, y)
      }
    }

    // Draw subtitles — style-aware
    if (styleConfig.animated && tikTokPages.length > 0) {
      const { page, activeTokenIndex } = getActivePageAndToken(tikTokPages, time)
      if (page) {
        drawAnimatedSubtitle(ctx, styleConfig, page, activeTokenIndex, outputSize)
      }
    } else {
      const currentSub = subtitles.find(s => time >= s.startTime && time <= s.endTime)
      if (currentSub) {
        const sc = outputSize.width / 1080
        const subFontSize = (styleConfig.fontSize || 28) * sc
        ctx.font = `${styleConfig.fontWeight || 'bold'} ${subFontSize}px ${styleConfig.fontFamily || 'Arial'}`
        ctx.textAlign = 'center'
        ctx.fillStyle = styleConfig.color || '#FFFFFF'
        if (styleConfig.strokeWidth > 0) {
          ctx.strokeStyle = styleConfig.strokeColor || '#000000'
          ctx.lineWidth = (styleConfig.strokeWidth || 3) * sc
          ctx.strokeText(currentSub.text, outputSize.width / 2, outputSize.height * 0.88)
        }
        ctx.fillText(currentSub.text, outputSize.width / 2, outputSize.height * 0.88)
        ctx.textAlign = 'start'
      }
    }

    // Capture canvas and encode via CanvasSource
    const timestamp = i / fps
    const frameDuration = 1 / fps
    const keyFrame = i % (fps * 2) === 0
    await videoSrc.add(timestamp, frameDuration, { keyFrame })

    const progress = 10 + Math.round((i / totalFrames) * 70)
    onProgress(Math.min(progress, 80))
  }

  videoSrc.close()
  onProgress(82)

  // 6. Process audio
  try {
    const audioCtx = new OfflineAudioContext(2, Math.ceil(duration * 44100), 44100)

    // Decode original video audio
    if (originalVolume > 0) {
      const audioBuffer = await videoBlob.arrayBuffer()
      try {
        const decoded = await audioCtx.decodeAudioData(audioBuffer.slice(0))
        const source = audioCtx.createBufferSource()
        source.buffer = decoded
        const gain = audioCtx.createGain()
        gain.gain.value = originalVolume
        source.connect(gain)
        gain.connect(audioCtx.destination)
        source.start(0, trimStart, duration)
      } catch {
        // Video may not have audio track — continue silently
      }
    }

    // Mix in imported audio if present
    if (audioFile && audioVolume > 0) {
      const importedBuffer = await audioFile.arrayBuffer()
      const importedDecoded = await audioCtx.decodeAudioData(importedBuffer)
      const source2 = audioCtx.createBufferSource()
      source2.buffer = importedDecoded
      const gain2 = audioCtx.createGain()
      gain2.gain.value = audioVolume
      source2.connect(gain2)
      gain2.connect(audioCtx.destination)
      source2.start(0, 0, duration)
    }

    onProgress(85)

    const renderedBuffer = await audioCtx.startRendering()

    // Feed AudioBuffer to mediabunny AudioBufferSource — handles encoding automatically
    await audioSrc.add(renderedBuffer)

    onProgress(90)
  } catch (err) {
    console.warn('Audio processing failed, exporting video-only:', err)
  }

  audioSrc.close()

  onProgress(92)

  // 7. Finalize output
  await output.finalize()

  onProgress(98)

  // Cleanup
  URL.revokeObjectURL(videoUrl)

  const buffer = target.buffer
  const blob = new Blob([buffer], { type: 'video/mp4' })

  onProgress(100)
  return blob
}
