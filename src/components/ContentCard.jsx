const STATUS_COLORS = {
  'idée':      'bg-gray-200 text-gray-600',
  'à-filmer':  'bg-yellow-100 text-yellow-700',
  'filmé':     'bg-blue-100 text-blue-700',
  'monté':     'bg-purple-100 text-purple-700',
  'schedulé':  'bg-orange-100 text-orange-700',
  'publié':    'bg-sage-100 text-sage-700',
}

const CATEGORY_COLORS = {
  'fertilité':            'text-pink-600',
  'grossesse':            'text-rose-500',
  'post-partum':          'text-purple-500',
  'enfant':               'text-blue-500',
  'acupuncture-pour-tous':'text-sage-600',
  'santé-générale':       'text-teal-600',
}

const PLATFORM_ICONS = {
  instagram: '📷',
  tiktok:    '🎵',
  youtube:   '▶️',
  facebook:  '👥',
  pinterest: '📌',
}

export default function ContentCard({ item, compact = false, onSchedule, onOpen }) {
  const statusClass = STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-500'
  const catClass = CATEGORY_COLORS[item.category] || 'text-gray-500'

  if (compact) {
    return (
      <div onClick={() => onOpen && onOpen(item)} className={`rounded px-2 py-1 text-xs truncate border-l-2 ${onOpen ? "cursor-pointer hover:opacity-80" : ""} ${
        item.status === 'publié'   ? 'border-sage-500 bg-sage-50' :
        item.status === 'schedulé' ? 'border-orange-400 bg-orange-50' :
        item.status === 'filmé'    ? 'border-blue-400 bg-blue-50' :
        item.status === 'monté'    ? 'border-purple-400 bg-purple-50' :
        item.status === 'à-filmer' ? 'border-yellow-400 bg-yellow-50' :
        'border-gray-300 bg-gray-50'
      }`}>
        {item.title}
      </div>
    )
  }

  return (
    <div onClick={() => onOpen && onOpen(item)} className={`bg-white rounded-xl border border-sand-200 p-4 shadow-sm hover:shadow-md transition group ${onOpen ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-sm text-gray-800 leading-snug">{item.title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${statusClass}`}>
          {item.status}
        </span>
      </div>

      <p className={`text-xs font-medium capitalize mb-3 ${catClass}`}>{item.category}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(item.platforms || []).map(p => (
            <span key={p} title={p} className="text-sm">{PLATFORM_ICONS[p] || '🌐'}</span>
          ))}
        </div>
        {item.notes && !onSchedule && (
          <span className="text-xs text-gray-400 italic truncate max-w-[120px]">{item.notes}</span>
        )}
      </div>

      {/* Bouton Planifier — visible seulement depuis la banque d'idées */}
      {onSchedule && (
        <button
          onClick={() => onSchedule(item)}
          className="mt-3 w-full text-xs font-medium text-sage-600 border border-sage-200
                     hover:bg-sage-500 hover:text-white hover:border-sage-500
                     rounded-lg py-1.5 transition"
        >
          Planifier →
        </button>
      )}
    </div>
  )
}
