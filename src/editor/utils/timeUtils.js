/**
 * Format seconds to MM:SS.ms display
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Format seconds to MM:SS.d (with tenths)
 */
export function formatTimePrecise(seconds) {
  if (!seconds || seconds < 0) return '00:00.0'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
