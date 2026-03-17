/**
 * A single timeline track row showing labeled segments.
 *
 * @param {string} label    - Track label (e.g., "Vidéo", "Audio", "Subs")
 * @param {string} color    - Tailwind bg color class for segments
 * @param {Array}  items    - [{start, end, label}] in seconds
 * @param {number} duration - Total timeline duration in seconds
 */
export default function TimelineTrack({ label, color, items, duration }) {
  if (!duration) return null

  return (
    <div className="flex items-center gap-2 mt-1.5">
      {/* Track label */}
      <span className="text-xs text-gray-500 w-12 flex-shrink-0 truncate">{label}</span>

      {/* Track bar */}
      <div className="flex-1 relative h-6 bg-gray-800 rounded overflow-hidden">
        {items.map((item, i) => {
          const leftPct = (item.start / duration) * 100
          const widthPct = ((item.end - item.start) / duration) * 100
          return (
            <div
              key={i}
              className={`absolute top-0 h-full ${color} rounded flex items-center px-1.5 overflow-hidden`}
              style={{
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 0.5)}%`,
                opacity: 0.8,
              }}
            >
              <span className="text-xs text-white truncate font-medium"
                    style={{ fontSize: '10px' }}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
