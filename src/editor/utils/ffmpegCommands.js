/**
 * Build FFmpeg command args for video export with all layers.
 *
 * @param {object} opts
 * @param {string} opts.inputFile   - input filename in FFmpeg virtual FS
 * @param {string} opts.outputFile  - output filename in FFmpeg virtual FS
 * @param {number} opts.trimStart   - trim start in seconds
 * @param {number} opts.trimEnd     - trim end in seconds
 * @param {string|null} opts.audioFile    - imported audio filename (or null)
 * @param {number} opts.audioVolume       - imported audio volume 0-1
 * @param {number} opts.originalVolume    - original audio volume 0-1
 * @param {string|null} opts.subtitleFile - SRT filename in virtual FS (or null)
 * @param {Array} opts.textOverlays      - array of text overlay objects
 * @param {object} opts.outputSize       - { width, height } for output
 * @returns {string[]} FFmpeg command arguments
 */
export function buildExportCommand(opts) {
  const {
    inputFile,
    outputFile,
    trimStart = 0,
    trimEnd,
    audioFile = null,
    audioVolume = 0.5,
    originalVolume = 1,
    subtitleFile = null,
    textOverlays = [],
    outputSize = { width: 1080, height: 1920 },
  } = opts

  const args = []

  // Trim: -ss BEFORE -i = input seeking (much faster, skips decoding)
  if (trimStart > 0) {
    args.push('-ss', String(trimStart))
  }

  // Input file
  args.push('-i', inputFile)

  // Trim duration (after -i so it's relative to seeked position)
  if (trimEnd && trimEnd > trimStart) {
    args.push('-t', String(trimEnd - trimStart))
  }

  // Import audio if provided
  if (audioFile) {
    args.push('-i', audioFile)
  }

  // Build video filter chain
  const vFilters = []

  // Scale to output size
  vFilters.push(`scale=${outputSize.width}:${outputSize.height}:force_original_aspect_ratio=decrease`)
  vFilters.push(`pad=${outputSize.width}:${outputSize.height}:(ow-iw)/2:(oh-ih)/2:black`)

  // Burn subtitles
  if (subtitleFile) {
    vFilters.push(`subtitles=${subtitleFile}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2'`)
  }

  // Burn text overlays (only those with text)
  for (const overlay of textOverlays) {
    if (!overlay.text) continue
    const x = Math.round(overlay.x * outputSize.width)
    const y = Math.round(overlay.y * outputSize.height)
    const fontSize = overlay.fontSize || 48
    const color = (overlay.color || '#FFFFFF').replace('#', '')
    const enable = `between(t,${overlay.startTime},${overlay.endTime})`

    vFilters.push(
      `drawtext=text='${escapeFFmpegText(overlay.text)}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=0x${color}:enable='${enable}'`
    )
  }

  if (vFilters.length > 0) {
    args.push('-vf', vFilters.join(','))
  }

  // Audio mixing
  if (audioFile) {
    args.push(
      '-filter_complex',
      `[0:a]volume=${originalVolume}[a0];[1:a]volume=${audioVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]`,
      '-map', '0:v',
      '-map', '[aout]'
    )
  } else {
    args.push('-af', `volume=${originalVolume}`)
  }

  // Output codec settings
  // NOTE: ultrafast + crf 28 optimized for FFmpeg.wasm single-thread perf.
  // Real solution: migrate to WebCodecs + Mediabunny (Phase 3) for 10-50x speedup.
  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-threads', '1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputFile
  )

  return args
}

/**
 * Escape text for FFmpeg drawtext filter
 */
function escapeFFmpegText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\n/g, '\\n')
}
