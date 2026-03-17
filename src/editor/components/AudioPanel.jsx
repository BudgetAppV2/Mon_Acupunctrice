import { useRef, useEffect } from 'react'
import useEditorStore from '../store/useEditorStore.js'

export default function AudioPanel() {
  const audioUrl = useEditorStore(s => s.audioUrl)
  const audioVolume = useEditorStore(s => s.audioVolume)
  const originalAudioVolume = useEditorStore(s => s.originalAudioVolume)
  const setAudio = useEditorStore(s => s.setAudio)
  const clearAudio = useEditorStore(s => s.clearAudio)
  const setAudioVolume = useEditorStore(s => s.setAudioVolume)
  const setOriginalAudioVolume = useEditorStore(s => s.setOriginalAudioVolume)

  const fileInputRef = useRef(null)
  const waveformRef = useRef(null)
  const wavesurferRef = useRef(null)

  // Initialize WaveSurfer when audio loads
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
      ws.load(audioUrl)
      wavesurferRef.current = ws
    }

    initWaveSurfer()

    return () => {
      if (ws) ws.destroy()
    }
  }, [audioUrl])

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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Audio</h3>
        {!audioUrl && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-sage-500 hover:bg-sage-600 text-white px-3 py-1 rounded-full
                       font-medium transition"
          >
            + Importer
          </button>
        )}
      </div>

      {/* Original audio volume */}
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

      {/* Imported audio */}
      {audioUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Musique importée</span>
            <button
              onClick={handleRemoveAudio}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Retirer
            </button>
          </div>

          {/* Waveform */}
          <div
            ref={waveformRef}
            className="bg-gray-800 rounded-lg overflow-hidden"
          />

          {/* Volume */}
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
      ) : (
        <p className="text-xs text-gray-500 text-center py-4">
          Ajoute de la musique de fond à ta vidéo
        </p>
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
