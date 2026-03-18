import { useRef, useEffect, useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import useEditorStore from '../store/useEditorStore.js'

// TODO: Onglet "Générer" (musique AI) — prévu Phase 4
// Options à évaluer: Suno API, Soundraw, ou autre API gratuite

const AUDIO_TABS = [
  { id: 'library', label: 'Bibliothèque', icon: '🎵' },
  { id: 'file', label: 'Fichier', icon: '📁' },
]

const MOOD_FILTERS = [
  { label: 'Relaxant', tag: 'relaxing' },
  { label: 'Acoustique', tag: 'acoustic' },
  { label: 'Ambiant', tag: 'ambient' },
  { label: 'Énergique', tag: 'energetic' },
]

export default function AudioPanel() {
  const audioUrl = useEditorStore(s => s.audioUrl)
  const audioVolume = useEditorStore(s => s.audioVolume)
  const originalAudioVolume = useEditorStore(s => s.originalAudioVolume)
  const setAudio = useEditorStore(s => s.setAudio)
  const clearAudio = useEditorStore(s => s.clearAudio)
  const setAudioVolume = useEditorStore(s => s.setAudioVolume)
  const setOriginalAudioVolume = useEditorStore(s => s.setOriginalAudioVolume)

  const [activeTab, setActiveTab] = useState('library')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)

  // WaveSurfer for imported audio
  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return
    let ws = null
    const initWaveSurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default
      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#6b8f71',
        progressColor: '#4a6b50',
        cursorColor: '#ffffff',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 48,
        responsive: true,
      })
      ws.on('error', (err) => console.error('[WaveSurfer] Error:', err))
      ws.load(audioUrl)
      ws.setVolume(audioVolume)
      wavesurferRef.current = ws
    }
    initWaveSurfer()
    return () => { if (ws) ws.destroy() }
  }, [audioUrl])

  // Sync audioVolume slider with WaveSurfer
  useEffect(() => {
    if (wavesurferRef.current) wavesurferRef.current.setVolume(audioVolume)
  }, [audioVolume])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAudio(file, url)
  }

  const handleRemoveAudio = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }
    clearAudio()
  }

  const handleImportFromUrl = async (streamUrl) => {
    setImporting(true)
    try {
      const response = await fetch(streamUrl)
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
      const blob = await response.blob()
      const file = new File([blob], 'music.mp3', { type: blob.type || 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      setAudio(file, url)
    } catch (err) {
      console.error('Failed to import audio from URL:', err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Audio</h3>
        {audioUrl && (
          <button
            onClick={handleRemoveAudio}
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            Retirer
          </button>
        )}
      </div>

      {/* Original audio volume — always visible */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400">Audio original</label>
          <span className="text-xs text-gray-500 font-mono">
            {Math.round(originalAudioVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={originalAudioVolume}
          onChange={(e) => setOriginalAudioVolume(Number(e.target.value))}
          className="w-full accent-sage-500"
        />
      </div>

      {/* Imported audio waveform + volume (if audio loaded) */}
      {audioUrl && (
        <div className="space-y-2">
          <span className="text-xs text-gray-400">Musique importée</span>
          <div ref={waveformRef} className="bg-gray-800 rounded-lg overflow-hidden" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">Volume musique</label>
              <span className="text-xs text-gray-500 font-mono">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={audioVolume}
              onChange={(e) => setAudioVolume(Number(e.target.value))}
              className="w-full accent-sage-500"
            />
          </div>
        </div>
      )}

      {/* Import loading state */}
      {importing && (
        <div className="text-center py-4 space-y-2">
          <div className="inline-block w-5 h-5 border-2 border-sage-400/30 border-t-sage-400
                          rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Importation en cours...</p>
        </div>
      )}

      {/* Tabs — only show when no audio imported yet */}
      {!audioUrl && !importing && (
        <>
          <div className="flex rounded-lg bg-gray-700/50 p-0.5">
            {AUDIO_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'library' && (
            <JamendoLibrary onImport={handleImportFromUrl} />
          )}

          {activeTab === 'file' && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-gray-500">
                Importe un fichier audio depuis ton appareil
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-full
                           font-medium transition"
              >
                Choisir un fichier
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/aac,audio/ogg"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}

// ─── Jamendo Library Sub-component ──────────────────────────────

function JamendoLibrary({ onImport }) {
  const [query, setQuery] = useState('')
  const [activeMood, setActiveMood] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewAudio, setPreviewAudio] = useState(null)
  const [previewId, setPreviewId] = useState(null)
  const audioRef = useRef(null)

  // Search on mount with default mood
  useEffect(() => {
    searchTracks(null, 'relaxing')
  }, [])

  const searchTracks = async (searchQuery, tags) => {
    setLoading(true)
    setError(null)
    try {
      const functions = getFunctions()
      const search = httpsCallable(functions, 'searchJamendo')
      const result = await search({
        query: searchQuery || undefined,
        tags: tags || undefined,
        limit: 20,
      })
      setTracks(result.data?.tracks || [])
    } catch (err) {
      console.error('Jamendo search error:', err)
      setError('Erreur de recherche')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setActiveMood(null)
    searchTracks(query, null)
  }

  const handleMoodFilter = (tag) => {
    setActiveMood(tag)
    setQuery('')
    searchTracks(null, tag)
  }

  const handlePreview = (track) => {
    if (previewId === track.id) {
      // Stop preview
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPreviewId(null)
      return
    }
    // Stop previous
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(`/proxy-audio?url=${encodeURIComponent(track.audio)}`)
    audio.volume = 0.5
    audio.play()
    audio.onended = () => setPreviewId(null)
    audioRef.current = audio
    setPreviewId(track.id)
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs
                     text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-sage-400"
        />
        <button
          type="submit"
          className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1.5 rounded-lg transition"
        >
          OK
        </button>
      </form>

      {/* Mood filters */}
      <div className="flex gap-1.5 flex-wrap">
        {MOOD_FILTERS.map(mood => (
          <button
            key={mood.tag}
            onClick={() => handleMoodFilter(mood.tag)}
            className={`text-xs px-2 py-1 rounded-full transition ${
              activeMood === mood.tag
                ? 'bg-sage-500/30 text-sage-300 border border-sage-400'
                : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
            }`}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-3">
          <div className="inline-block w-5 h-5 border-2 border-sage-400/30 border-t-sage-400
                          rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && tracks.length > 0 && (
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {tracks.map(track => (
            <div
              key={track.id}
              className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-800 border border-gray-700
                         hover:border-gray-600 transition"
            >
              {/* Album art */}
              <img
                src={track.image}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0"
                crossOrigin="anonymous"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate font-medium">{track.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {track.artist_name} &middot; {formatDuration(track.duration)}
                </p>
              </div>

              {/* Preview button */}
              <button
                onClick={() => handlePreview(track)}
                className={`text-xs w-7 h-7 rounded-full flex items-center justify-center transition ${
                  previewId === track.id
                    ? 'bg-sage-500 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {previewId === track.id ? '⏸' : '▶'}
              </button>

              {/* Import button */}
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause()
                  setPreviewId(null)
                  onImport(`/proxy-audio?url=${encodeURIComponent(track.audio)}`)
                }}
                className="text-xs w-7 h-7 rounded-full bg-sage-500/20 text-sage-400
                           hover:bg-sage-500/40 flex items-center justify-center transition"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && tracks.length === 0 && !error && (
        <p className="text-xs text-gray-500 text-center py-3">Aucun résultat</p>
      )}
    </div>
  )
}

