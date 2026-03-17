import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import ContentCard from '../components/ContentCard.jsx'
import NewContentModal from '../components/NewContentModal.jsx'
import { useContentItems } from '../hooks/useContentItems.js'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function CalendarPage({ onSelectItem }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const { items, loading, addItem }     = useContentItems()

  const monthStart  = startOfMonth(currentMonth)
  const monthEnd    = endOfMonth(currentMonth)
  const days        = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad    = getDay(monthStart)
  const paddingDays = Array(startPad).fill(null)

  const itemsForDay = (day) =>
    items.filter(i => i.scheduledDate && isSameDay(i.scheduledDate, day))

  const handleAddItem = async (newItem) => {
    await addItem(newItem)
    setShowModal(false)
  }

  return (
    <div>
      {/* Nav mois */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="p-2 rounded-full hover:bg-sage-100 text-sage-600 transition">←</button>
        <h2 className="text-lg font-semibold text-sage-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="p-2 rounded-full hover:bg-sage-100 text-sage-600 transition">→</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
          {/* En-têtes */}
          <div className="grid grid-cols-7 border-b border-sand-100">
            {DAYS_FR.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-3">{d}</div>
            ))}
          </div>
          {/* Cellules */}
          <div className="grid grid-cols-7">
            {paddingDays.map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[90px] border-b border-r border-sand-100 bg-sand-50/50" />
            ))}
            {days.map((day, i) => {
              const dayItems = itemsForDay(day)
              const isToday  = isSameDay(day, new Date())
              return (
                <div key={i}
                  onClick={() => { setSelectedDay(day); setShowModal(true) }}
                  className={`min-h-[90px] border-b border-r border-sand-100 p-2 cursor-pointer hover:bg-sage-50 transition group ${isToday ? 'bg-sage-50' : ''}`}>
                  <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-sage-500 text-white' : 'text-gray-500 group-hover:text-sage-700'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-1">
                    {dayItems.map(item => <ContentCard key={item.id} item={item} compact onOpen={onSelectItem} />)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
        {Object.entries(STATUS_DOT).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${c}`} /> {s}
          </span>
        ))}
      </div>

      {/* Bouton + */}
      <button
        onClick={() => { setSelectedDay(new Date()); setShowModal(true) }}
        className="fixed bottom-8 right-8 bg-sage-500 hover:bg-sage-600 text-white w-14 h-14 rounded-full shadow-lg text-2xl transition flex items-center justify-center">
        +
      </button>

      {showModal && (
        <NewContentModal
          defaultDate={selectedDay}
          onSave={handleAddItem}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export const STATUS_DOT = {
  'idée':      'bg-gray-300',
  'à-filmer':  'bg-yellow-400',
  'filmé':     'bg-blue-400',
  'monté':     'bg-purple-400',
  'schedulé':  'bg-orange-400',
  'publié':    'bg-sage-500',
}
