import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useContentItems } from '../hooks/useContentItems.js'

const CATEGORY_COLORS = {
  'fertilité':             { bg: 'bg-pink-50',   border: 'border-pink-200',  text: 'text-pink-700',  dot: 'bg-pink-400' },
  'grossesse':             { bg: 'bg-rose-50',    border: 'border-rose-200',  text: 'text-rose-700',  dot: 'bg-rose-400' },
  'post-partum':           { bg: 'bg-purple-50',  border: 'border-purple-200',text: 'text-purple-700',dot: 'bg-purple-400' },
  'enfant':                { bg: 'bg-blue-50',    border: 'border-blue-200',  text: 'text-blue-700',  dot: 'bg-blue-400' },
  'acupuncture-pour-tous': { bg: 'bg-sage-50',    border: 'border-sage-200',  text: 'text-sage-700',  dot: 'bg-sage-400' },
  'santé-générale':        { bg: 'bg-teal-50',    border: 'border-teal-200',  text: 'text-teal-700',  dot: 'bg-teal-400' },
}

const PLATFORM_ICONS = {
  instagram: '📷', tiktok: '🎵', youtube: '▶️', facebook: '👥', pinterest: '📌',
}

// Ordre de tournage suggéré par catégorie (regrouper par décor/ambiance)
const CATEGORY_ORDER = [
  'grossesse', 'fertilité', 'post-partum', 'enfant',
  'acupuncture-pour-tous', 'santé-générale'
]

export default function BlitzPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { items, loading, updateItem } = useContentItems()

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: fr })
  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)

  // Items du blitz = schedulés dans ce mois ET statut à-filmer ou filmé
  const blitzItems = items.filter(i => {
    if (!i.scheduledDate) return false
    const d = i.scheduledDate instanceof Date ? i.scheduledDate : i.scheduledDate.toDate?.()
    if (!d) return false
    return d >= monthStart && d <= monthEnd &&
      (i.status === 'à-filmer' || i.status === 'filmé')
  })

  // Grouper par catégorie dans l'ordre suggéré
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const group = blitzItems.filter(i => i.category === cat)
    if (group.length > 0) acc[cat] = group
    return acc
  }, {})
  // Catégories inconnues en dernier
  blitzItems.forEach(i => {
    if (!CATEGORY_ORDER.includes(i.category)) {
      if (!grouped[i.category]) grouped[i.category] = []
      if (!grouped[i.category].find(x => x.id === i.id)) grouped[i.category].push(i)
    }
  })

  const total   = blitzItems.length
  const filmed  = blitzItems.filter(i => i.status === 'filmé').length
  const pct     = total > 0 ? Math.round((filmed / total) * 100) : 0

  const toggleFilmed = async (item) => {
    await updateItem(item.id, {
      status: item.status === 'filmé' ? 'à-filmer' : 'filmé'
    })
  }

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header blitz */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-sage-100 text-sage-600 transition">←</button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-sage-800 capitalize">
            Blitz — {monthLabel}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total === 0
              ? 'Aucun item planifié ce mois-ci'
              : `${filmed} / ${total} tournés`}
          </p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-sage-100 text-sage-600 transition">→</button>
      </div>

      {/* Barre de progression */}
      {total > 0 && (
        <div className="mb-8">
          <div className="h-3 bg-sand-200 rounded-full overflow-hidden">
            <div
              className="h-3 bg-sage-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{filmed} filmés</span>
            <span className={pct === 100 ? 'text-sage-600 font-semibold' : ''}>
              {pct === 100 ? '🎉 Blitz complété!' : `${pct}%`}
            </span>
            <span>{total - filmed} restants</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : total === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎬</div>
          <p className="font-medium text-gray-500 mb-1">Aucun tournage planifié ce mois-ci</p>
          <p className="text-sm">Va dans la banque d'idées et planifie des items pour {monthLabel}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const colors = CATEGORY_COLORS[cat] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' }
            const catFilmed = catItems.filter(i => i.status === 'filmé').length
            return (
              <div key={cat}>
                {/* Titre catégorie */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide capitalize ${colors.text}`}>
                    {cat}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{catFilmed}/{catItems.length}</span>
                </div>

                {/* Items de la catégorie */}
                <div className="space-y-2">
                  {catItems.map(item => {
                    const isFilmed = item.status === 'filmé'
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleFilmed(item)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                          transition-all active:scale-98 select-none
                          ${isFilmed
                            ? 'bg-sage-50 border-sage-200 opacity-70'
                            : `${colors.bg} ${colors.border} hover:shadow-sm`
                          }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isFilmed
                            ? 'bg-sage-500 border-sage-500'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isFilmed && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-snug ${isFilmed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {(item.platforms || []).map(p => (
                              <span key={p} className="text-xs">{PLATFORM_ICONS[p]}</span>
                            ))}
                            {item.scheduledDate && (
                              <span className="text-xs text-gray-400 ml-1">
                                · {format(
                                    item.scheduledDate instanceof Date
                                      ? item.scheduledDate
                                      : item.scheduledDate.toDate?.(),
                                    'd MMM', { locale: fr }
                                  )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badge statut */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          isFilmed ? 'bg-sage-100 text-sage-700' : 'bg-white text-gray-500 border border-gray-200'
                        }`}>
                          {isFilmed ? '✓ filmé' : 'à filmer'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tip ordre de tournage */}
      {total > 0 && filmed < total && (
        <div className="mt-8 p-3 bg-sand-100 rounded-xl text-xs text-gray-500 text-center">
          💡 Les sujets sont groupés par catégorie pour optimiser tes changements de décor et de tenue.
        </div>
      )}
    </div>
  )
}
