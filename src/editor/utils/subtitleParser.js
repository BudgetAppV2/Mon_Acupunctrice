/**
 * Convert subtitle array to SRT format string (for FFmpeg burn-in)
 */
export function toSRT(subtitles) {
  return subtitles
    .map((sub, i) => {
      const start = secondsToSRTTime(sub.startTime)
      const end = secondsToSRTTime(sub.endTime)
      return `${i + 1}\n${start} --> ${end}\n${sub.text}\n`
    })
    .join('\n')
}

/**
 * Convert seconds to SRT timestamp format HH:MM:SS,mmm
 */
function secondsToSRTTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, '0')}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

/**
 * Parse Whisper API verbose_json response to subtitle array
 */
export function parseWhisperResponse(segments) {
  return segments.map((seg, i) => ({
    id: `sub_${i}`,
    text: seg.text.trim(),
    startTime: seg.start,
    endTime: seg.end,
  }))
}
