import { useState } from 'react'
import ContentCard from '../components/ContentCard.jsx'
import NewContentModal from '../components/NewContentModal.jsx'
import { useContentItems } from '../hooks/useContentItems.js'

const CATEGORIES = ['toutes','fertilité','grossesse','post-partum','enfant','acupuncture-pour-tous','santé-générale']

export default function IdeasPage() {
  const [filter, setFilter]       = useState('toutes')
  const [showModal, setShowModal] = useState(false)
  const { items, loading, addItem } = useContentItems()

  // La banque d'idées = items sans date planifiée
  const ideas = items.filter(i => !i.scheduledDate)
  const filtered = filter === 'toutes' ? ideas : ideas.filter(i => i.category === filter)

  const handleAdd = async (newItem) => {
    await addItem({ ...newItem, status: 'idée', scheduledDate: null })
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-sage-800">
          Banque d'idées
          <span className="ml-2 text-sm font-normal text-gray-400">({ideas.length} idées)</span>
        </h2>
        <button onClick={() => setShowModal(true)}
          className="bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-full text-sm font-medium transition">
          + Nouvelle idée
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
              filter === cat
                ? 'bg-sage-500 text-white'
                : 'bg-white border border-sand-200 text-gray-500 hover:border-sage-300'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(idea => <ContentCard key={idea.id} item={idea} />)}
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm col-span-3 text-center py-12">
              Aucune idée dans cette catégorie.
            </p>
          )}
        </div>
      )}

      {showModal && (
        <NewContentModal onSave={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
