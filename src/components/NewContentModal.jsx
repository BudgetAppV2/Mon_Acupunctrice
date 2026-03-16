import { useState } from 'react'
import { format } from 'date-fns'

const CATEGORIES = ['fertilité','grossesse','post-partum','enfant','acupuncture-pour-tous','santé-générale']
const STATUSES   = ['idée','à-filmer','filmé','monté','schedulé','publié']
const PLATFORMS  = ['instagram','tiktok','youtube','facebook','pinterest']

export default function NewContentModal({ defaultDate, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    category: 'grossesse',
    status: 'idée',
    platforms: ['instagram'],
    scheduledDate: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
    notes: '',
  })

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }))
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({
      ...form,
      scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-sage-800 mb-4">Nouveau contenu</h3>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sujet / titre</label>
            <input
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
              placeholder="Ex: Nausées de grossesse — 3 solutions naturelles"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Catégorie + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
              <select
                className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
              <select
                className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Date de publication prévue</label>
            <input
              type="date"
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
              value={form.scheduledDate}
              onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
            />
          </div>

          {/* Plateformes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    form.platforms.includes(p)
                      ? 'bg-sage-500 text-white border-sage-500'
                      : 'bg-white text-gray-500 border-sand-200 hover:border-sage-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
            <textarea
              className="w-full border border-sand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
              rows={2}
              placeholder="Lien article de blog, idées de contenu..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-sand-200 text-gray-500 py-2 rounded-full text-sm hover:bg-sand-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 bg-sage-500 hover:bg-sage-600 disabled:opacity-40 text-white py-2 rounded-full text-sm font-medium transition"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}
