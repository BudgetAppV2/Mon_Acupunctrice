import { useState } from 'react'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../../firebase.js'
import useEditorStore from '../store/useEditorStore.js'
import { formatTime } from '../utils/timeUtils.js'

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
  const contentItemId = useEditorStore(s => s.contentItemId)

  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!videoFile) return
    setGeneratingSubtitles(true)
    setError(null)

    try {
      // Upload video to temp storage for transcription
      const tempPath = `temp_audio/${contentItemId || 'editor'}/${Date.now()}.webm`
      const storageRef = ref(storage, tempPath)
      await uploadBytes(storageRef, videoFile)
      const audioUrl = await getDownloadURL(storageRef)

      // Call transcription Cloud Function
      const functions = getFunctions()
      const transcribeAudio = httpsCallable(functions, 'transcribeAudio')
      const result = await transcribeAudio({
        audioUrl,
        storagePath: tempPath,
      })

      if (result.data?.subtitles) {
        setSubtitles(result.data.subtitles)
      }

      // Cleanup temp file (Cloud Function should also do this)
      try { await deleteObject(storageRef) } catch {}
    } catch (err) {
      console.error('Subtitle generation error:', err)
      setError(err.message || 'Erreur lors de la génération des sous-titres')
    } finally {
      setGeneratingSubtitles(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Sous-titres</h3>
        <div className="flex items-center gap-2">
          {subtitles.length > 0 && (
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
            disabled={generatingSubtitles || !videoFile}
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
        <div className="text-center py-6">
          <div className="inline-block w-6 h-6 border-2 border-sage-400/30 border-t-sage-400
                          rounded-full animate-spin mb-2" />
          <p className="text-xs text-gray-400">Transcription en cours...</p>
          <p className="text-xs text-gray-500 mt-1">Whisper + Claude pour le français QC</p>
        </div>
      )}

      {/* Subtitle segments */}
      {subtitles.length === 0 && !generatingSubtitles && (
        <p className="text-xs text-gray-500 text-center py-4">
          Génère automatiquement les sous-titres de ta vidéo
        </p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {subtitles.map(sub => (
          <div
            key={sub.id}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700"
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
    </div>
  )
}
