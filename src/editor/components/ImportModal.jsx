import { useState, useRef, useEffect } from 'react'
import { useMediaRecorder } from '../hooks/useMediaRecorder.js'
import useEditorStore from '../store/useEditorStore.js'

export default function ImportModal() {
  const [mode, setMode] = useState(null) // null | 'webcam' | 'screen'
  const loadVideo = useEditorStore(s => s.loadVideo)
  const setShowImportModal = useEditorStore(s => s.setShowImportModal)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  const {
    recording, stream, countdown,
    startWebcam, startScreen, startRecording, stopRecording, cleanup,
  } = useMediaRecorder()

  // Attach stream to preview video element
  useEffect(() => {
    if (previewRef.current && stream) {
      previewRef.current.srcObject = stream
    }
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    loadVideo(file, url)
  }

  const handleStartWebcam = async () => {
    setMode('webcam')
    await startWebcam()
  }

  const handleStartScreen = async () => {
    setMode('screen')
    await startScreen()
  }

  const handleRecord = async () => {
    const result = await startRecording()
    loadVideo(result.file, result.url)
    cleanup()
  }

  const handleStopRecording = () => {
    stopRecording()
  }

  // If we're in recording/preview mode
  if (mode && stream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Preview */}
        <div className="flex-1 relative flex items-center justify-center">
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className={`max-h-full max-w-full ${mode === 'webcam' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Countdown overlay */}
          {countdown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-8xl font-bold text-white animate-pulse">{countdown}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
          <button
            onClick={() => { cleanup(); setMode(null) }}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 transition"
          >
            Annuler
          </button>

          {!recording ? (
            <button
              onClick={handleRecord}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white
                         transition flex items-center justify-center"
            >
              <span className="w-6 h-6 rounded-full bg-white" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 border-4 border-white
                         transition flex items-center justify-center"
            >
              <span className="w-6 h-6 rounded bg-white" />
            </button>
          )}

          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>
    )
  }

  // Default: import selection
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Importer une vidéo</h2>
          <button
            onClick={() => setShowImportModal(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          {/* Upload from device */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-sand-200
                       hover:border-sage-300 hover:bg-sage-50 transition text-left"
          >
            <span className="text-2xl">📁</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Depuis l'appareil</p>
              <p className="text-xs text-gray-400">MP4, MOV, WebM</p>
            </div>
          </button>

          {/* Record webcam */}
          <button
            onClick={handleStartWebcam}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-sand-200
                       hover:border-sage-300 hover:bg-sage-50 transition text-left"
          >
            <span className="text-2xl">📷</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Enregistrer (webcam)</p>
              <p className="text-xs text-gray-400">Caméra frontale avec audio</p>
            </div>
          </button>

          {/* Record screen */}
          <button
            onClick={handleStartScreen}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-sand-200
                       hover:border-sage-300 hover:bg-sage-50 transition text-left"
          >
            <span className="text-2xl">🖥</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Enregistrer l'écran</p>
              <p className="text-xs text-gray-400">Partage d'écran avec audio</p>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
