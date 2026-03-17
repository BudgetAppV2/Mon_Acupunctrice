import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase.js'
import useEditorStore from '../store/useEditorStore.js'
import { useFFmpeg } from '../hooks/useFFmpeg.js'
import { useContentItems } from '../../hooks/useContentItems.js'
import { buildExportCommand } from '../utils/ffmpegCommands.js'
import { toSRT } from '../utils/subtitleParser.js'

const FORMAT_OPTIONS = [
  { label: 'Reel (9:16)', width: 1080, height: 1920 },
  { label: 'Carré (1:1)', width: 1080, height: 1080 },
  { label: 'Paysage (16:9)', width: 1920, height: 1080 },
]

export default function ExportModal({ onClose }) {
  const navigate = useNavigate()
  const [format, setFormat] = useState(FORMAT_OPTIONS[0])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  const { load, writeFile, readFile, exec } = useFFmpeg()
  const { updateItem } = useContentItems()

  const videoFile = useEditorStore(s => s.videoFile)
  const videoUrl = useEditorStore(s => s.videoUrl)
  const trimStart = useEditorStore(s => s.trimStart)
  const trimEnd = useEditorStore(s => s.trimEnd)
  const audioFile = useEditorStore(s => s.audioFile)
  const audioVolume = useEditorStore(s => s.audioVolume)
  const originalAudioVolume = useEditorStore(s => s.originalAudioVolume)
  const textOverlays = useEditorStore(s => s.textOverlays)
  const subtitles = useEditorStore(s => s.subtitles)
  const contentItemId = useEditorStore(s => s.contentItemId)
  const isExporting = useEditorStore(s => s.isExporting)
  const exportProgress = useEditorStore(s => s.exportProgress)
  const exportedUrl = useEditorStore(s => s.exportedUrl)
  const setExporting = useEditorStore(s => s.setExporting)
  const setExportProgress = useEditorStore(s => s.setExportProgress)
  const setExported = useEditorStore(s => s.setExported)

  const handleExport = async () => {
    if (!videoFile && !videoUrl) return

    // Guard: reject invalid duration
    const duration = useEditorStore.getState().videoDuration
    if (!duration || !isFinite(duration)) {
      alert('Durée vidéo invalide — impossible d\'exporter. Essaie de réimporter la vidéo.')
      return
    }

    setExporting(true)
    setExportProgress(0)

    try {
      // Load FFmpeg
      await load()

      // Write input video to virtual FS
      const inputName = 'input.mp4'
      const outputName = 'output.mp4'

      if (videoFile) {
        await writeFile(inputName, videoFile)
      } else {
        // Fetch from URL
        const response = await fetch(videoUrl)
        const blob = await response.blob()
        await writeFile(inputName, blob)
      }

      // Write audio if present
      let audioName = null
      if (audioFile) {
        audioName = 'audio.mp3'
        await writeFile(audioName, audioFile)
      }

      // Write subtitles if present
      let subtitleName = null
      if (subtitles.length > 0) {
        subtitleName = 'subs.srt'
        const srtContent = toSRT(subtitles)
        await writeFile(subtitleName, srtContent)
      }

      // Build and run FFmpeg command
      const args = buildExportCommand({
        inputFile: inputName,
        outputFile: outputName,
        trimStart,
        trimEnd,
        audioFile: audioName,
        audioVolume,
        originalVolume: originalAudioVolume,
        subtitleFile: subtitleName,
        textOverlays,
        outputSize: { width: format.width, height: format.height },
      })

      await exec(args, (progress) => {
        setExportProgress(progress)
      })

      // Read output
      const data = await readFile(outputName)
      const blob = new Blob([data.buffer], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)

      setExported(url, blob)
    } catch (err) {
      console.error('Export error:', err)
      alert('Erreur lors de l\'export: ' + err.message)
      setExporting(false)
    }
  }

  /**
   * Generate a thumbnail from the exported video (frame at t=0)
   */
  const generateThumbnail = (videoSrc) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.src = videoSrc

      video.onloadeddata = () => {
        video.currentTime = 0.1 // slight offset to avoid blank frame
      }

      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.85)
      }

      // Fallback if seeking fails
      video.onerror = () => resolve(null)
      setTimeout(() => resolve(null), 5000)
    })
  }

  const handleUploadToStorage = async () => {
    const blob = useEditorStore.getState().exportedBlob
    if (!blob || !contentItemId) return

    setUploading(true)
    try {
      // 1. Upload MP4
      const videoFileName = `export-${Date.now()}.mp4`
      const videoRef = ref(storage, `videos/${contentItemId}/${videoFileName}`)
      await uploadBytes(videoRef, blob)
      const videoDownloadUrl = await getDownloadURL(videoRef)

      // 2. Generate & upload thumbnail
      let thumbnailUrl = null
      const thumbBlob = await generateThumbnail(exportedUrl)
      if (thumbBlob) {
        const thumbRef = ref(storage, `videos/${contentItemId}/thumbnail.jpg`)
        await uploadBytes(thumbRef, thumbBlob)
        thumbnailUrl = await getDownloadURL(thumbRef)
      }

      // 3. Update Firestore
      const updates = {
        videoUrl: videoDownloadUrl,
        status: 'monté',
      }
      if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl
      console.log('[ExportModal] Saving to Firestore:', contentItemId, updates)
      await updateItem(contentItemId, updates)

      setSaved(true)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Exporter la vidéo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        {/* Format selection */}
        {!isExporting && !exportedUrl && (
          <>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-2">Format</label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map(f => (
                  <button
                    key={f.label}
                    onClick={() => setFormat(f)}
                    className={`flex-1 text-xs py-2 rounded-lg border transition font-medium ${
                      format.label === f.label
                        ? 'border-sage-400 bg-sage-500/20 text-sage-300'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-sage-500 hover:bg-sage-600 text-white py-3 rounded-xl
                         font-medium transition"
            >
              Lancer l'export
            </button>
          </>
        )}

        {/* Exporting progress */}
        {isExporting && (
          <div className="text-center py-8">
            <div className="inline-block w-10 h-10 border-3 border-sage-400/30 border-t-sage-400
                            rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-300 mb-2">Export en cours...</p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-2 bg-sage-500 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{exportProgress}%</p>
          </div>
        )}

        {/* Export complete */}
        {exportedUrl && !saved && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-gray-600">
              <video src={exportedUrl} controls className="w-full max-h-48" />
            </div>

            <div className="space-y-2">
              <a
                href={exportedUrl}
                download={`${useEditorStore.getState().contentItem?.title || 'video'}.mp4`}
                className="block w-full text-center bg-sage-500 hover:bg-sage-600 text-white py-2.5
                           rounded-xl font-medium transition text-sm"
              >
                Télécharger le MP4
              </a>

              {contentItemId && (
                <button
                  onClick={handleUploadToStorage}
                  disabled={uploading}
                  className="w-full text-center border border-sage-400 text-sage-400
                             hover:bg-sage-500/10 disabled:opacity-40 py-2.5 rounded-xl
                             font-medium transition text-sm"
                >
                  {uploading ? 'Sauvegarde en cours...' : 'Sauvegarder dans le hub'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-500/20 mb-2">
              <span className="text-3xl">&#10003;</span>
            </div>
            <p className="text-sm text-gray-200 font-medium">Vidéo sauvegardée dans le hub</p>
            <button
              onClick={() => navigate('/idees')}
              className="w-full bg-sage-500 hover:bg-sage-600 text-white py-2.5 rounded-xl
                         font-medium transition text-sm"
            >
              Retour aux idées
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
