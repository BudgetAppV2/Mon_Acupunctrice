import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../firebase.js'
import useEditorStore from '../store/useEditorStore.js'
import { formatTime } from '../utils/timeUtils.js'
import { SUBTITLE_STYLES, groupSubtitleWords } from '../utils/subtitleStyles.js'

export default function SubtitlePanel() {
  const subtitles = useEditorStore(s => s.subtitles)
  const setSubtitles = useEditorStore(s => s.setSubtitles)
  const subtitlesVisible = useEditorStore(s => s.subtitlesVisible)
  const toggleSubtitles = useEditorStore(s => s.toggleSubtitles)
  const generatingSubtitles = useEditorStore(s => s.generatingSubtitles)
  const setGeneratingSubtitles = useEditorStore(s => s.setGeneratingSubtitles)
  const updateSubtitle = useEditorStore(s => s.updateSubtitle)
  const removeSubtitle = useEditorStore(s => s.removeSubtitle)
  const videoFile = useEditorStore(s => s.videoFile)
  const videoUrl = useEditorStore(s => s.videoUrl)
  const contentItemId = useEditorStore(s => s.contentItemId)
  const contentItem = useEditorStore(s => s.contentItem)
  const subtitleStyle = useEditorStore(s => s.subtitleStyle)
  const setSubtitleStyle = useEditorStore(s => s.setSubtitleStyle)
  const subtitleConfig = useEditorStore(s => s.subtitleConfig)
  const setSubtitleConfig = useEditorStore(s => s.setSubtitleConfig)

  const [error, setError] = useState(null)

  const hasSubtitles = subtitles.length > 0

  const handleGenerate = async () => {
    if (!videoFile && !videoUrl) return
    setGeneratingSubtitles(true)
    setError(null)

    try {
      let storagePath
      let needsCleanup = false

      if (videoFile) {
        storagePath = `temp_audio/${contentItemId || 'editor'}/${Date.now()}.webm`
        const storageRef = ref(storage, storagePath)
        await uploadBytes(storageRef, videoFile)
        needsCleanup = true
      } else {
        const originalUrl = contentItem?.videoUrl || ''
        const pathMatch = originalUrl.match(/\/o\/(.+?)\?/)
        if (pathMatch) {
          storagePath = decodeURIComponent(pathMatch[1])
        } else {
          storagePath = `temp_audio/${contentItemId || 'editor'}/${Date.now()}.mp4`
          const response = await fetch(videoUrl)
          const blob = await response.blob()
          const storageRef = ref(storage, storagePath)
          await uploadBytes(storageRef, blob)
          needsCleanup = true
        }
      }

      const functions = getFunctions()
      const transcribeAudio = httpsCallable(functions, 'transcribeAudio')
      const result = await transcribeAudio({
        storagePath,
        cleanup: needsCleanup,
      })

      if (result.data?.subtitles) {
        // CF returns individual words — group them dynamically
        const grouped = groupSubtitleWords(result.data.subtitles)
        setSubtitles(grouped)
      }

      if (needsCleanup) {
        try { await deleteObject(ref(storage, storagePath)) } catch {}
      }
    } catch (err) {
      console.error('Subtitle generation error:', err)
      setError(err.message || 'Erreur lors de la génération des sous-titres')
    } finally {
      setGeneratingSubtitles(false)
    }
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header + generate button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Sous-titres</h3>
        <div className="flex items-center gap-2">
          {hasSubtitles && (
            <button
              onClick={toggleSubtitles}
              className={`text-xs px-2 py-1 rounded-full transition ${
                subtitlesVisible
                  ? 'bg-sage-500/20 text-sage-400'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              {subtitlesVisible ? 'Visible' : 'Masqué'}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={generatingSubtitles || (!videoFile && !videoUrl)}
            className="text-xs bg-sage-500 hover:bg-sage-600 disabled:opacity-40
                       text-white px-3 py-1 rounded-full font-medium transition"
          >
            {generatingSubtitles ? 'Génération...' : 'Auto-générer'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">{error}</p>
      )}

      {generatingSubtitles && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-sage-400/30 border-t-sage-400
                          rounded-full animate-spin mb-2" />
          <p className="text-xs text-gray-400">Transcription en cours...</p>
          <p className="text-xs text-gray-500 mt-1">Whisper + Claude pour le français QC</p>
        </div>
      )}

      {!hasSubtitles && !generatingSubtitles && (
        <p className="text-xs text-gray-500 text-center py-4">
          Génère automatiquement les sous-titres de ta vidéo
        </p>
      )}

      {/* ── Controls (shown immediately when subtitles exist) ── */}
      {hasSubtitles && (
        <>
          {/* Style presets */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Style</label>
            <div className="flex gap-2">
              {Object.values(SUBTITLE_STYLES).map(style => (
                <button
                  key={style.id}
                  onClick={() => setSubtitleStyle(style.id)}
                  className={`flex-1 text-center py-1.5 rounded-lg border text-xs font-medium transition ${
                    subtitleStyle === style.id
                      ? 'border-sage-400 bg-sage-500/20 text-sage-300'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className="block text-sm leading-none" style={{
                    color: style.id === 'tiktok' ? '#FFE135' : style.id === 'karaoke' ? '#00FF88' : '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}>
                    Aa
                  </span>
                  <span className="mt-0.5 block">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Taille : {subtitleConfig.fontSize}px
            </label>
            <input
              type="range"
              min={16}
              max={72}
              step={1}
              value={subtitleConfig.fontSize}
              onInput={(e) => setSubtitleConfig({ fontSize: parseInt(e.target.value) })}
              onChange={(e) => setSubtitleConfig({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Position presets */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Position</label>
            <div className="flex gap-2">
              {[
                { label: 'Haut', y: 0.1 },
                { label: 'Centre', y: 0.5 },
                { label: 'Bas', y: 0.85 },
              ].map(pos => (
                <button
                  key={pos.label}
                  onClick={() => setSubtitleConfig({ y: pos.y })}
                  className={`flex-1 text-center py-1.5 rounded-lg border text-xs font-medium transition ${
                    Math.abs(subtitleConfig.y - pos.y) < 0.05
                      ? 'border-sage-400 bg-sage-500/20 text-sage-300'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle segments list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subtitles.map(sub => (
              <div
                key={sub.id}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-mono">
                    {formatTime(sub.startTime)} &rarr; {formatTime(sub.endTime)}
                  </span>
                  <button
                    onClick={() => removeSubtitle(sub.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  value={sub.text}
                  onChange={(e) => updateSubtitle(sub.id, { text: e.target.value })}
                  rows={1}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white
                             focus:outline-none focus:ring-1 focus:ring-sage-400 resize-none"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
