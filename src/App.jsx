import { useState } from 'react'
import CalendarPage from './pages/CalendarPage.jsx'
import IdeasPage from './pages/IdeasPage.jsx'
import BlitzPage from './pages/BlitzPage.jsx'

const TABS = [
  { id: 'blitz',    label: '🎬 Blitz' },
  { id: 'calendar', label: '📅 Calendrier' },
  { id: 'ideas',    label: '💡 Banque d\'idées' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('blitz')

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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-sage-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-sage-50 hover:text-sage-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'blitz'    && <BlitzPage />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'ideas'    && <IdeasPage />}
      </main>
    </div>
  )
}
