import { useState } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import CalendarPage from './pages/CalendarPage.jsx'
import IdeasPage from './pages/IdeasPage.jsx'
import BlitzPage from './pages/BlitzPage.jsx'
import EditorPage from './editor/EditorPage.jsx'
import ItemPanel from './components/ItemPanel.jsx'

const TABS = [
  { id: 'blitz',    label: '🎬 Blitz',           path: '/blitz' },
  { id: 'calendar', label: '📅 Calendrier',       path: '/calendrier' },
  { id: 'ideas',    label: '💡 Banque d\'idées',  path: '/idees' },
]

export default function App() {
  const [selectedItem, setSelectedItem] = useState(null)
  const location = useLocation()
  const isEditor = location.pathname.startsWith('/editeur')

  // Editor is full-screen, no hub chrome
  if (isEditor) {
    return (
      <Routes>
        <Route path="/editeur/:id" element={<EditorPage />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="bg-white border-b border-sand-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-sage-700">Mon Acupunctrice</h1>
          <p className="text-xs text-gray-400">Hub de contenu — @mon_acupunctrice</p>
        </div>
        <nav className="flex gap-2">
          {TABS.map(tab => (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sage-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-sage-50 hover:text-sage-700'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/calendrier" replace />} />
          <Route path="/blitz" element={<BlitzPage onSelectItem={setSelectedItem} />} />
          <Route path="/calendrier" element={<CalendarPage onSelectItem={setSelectedItem} />} />
          <Route path="/idees" element={<IdeasPage onSelectItem={setSelectedItem} />} />
          <Route path="*" element={<Navigate to="/calendrier" replace />} />
        </Routes>
      </main>

      {/* Panneau latéral — ouvert si un item est sélectionné */}
      {selectedItem && (
        <ItemPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
