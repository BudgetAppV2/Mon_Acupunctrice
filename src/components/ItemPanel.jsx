import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { storage } from '../firebase.js'
import { useContentItems } from '../hooks/useContentItems.js'

const STATUSES = ['idée', 'à-filmer', 'filmé', 'monté', 'prêt', 'publié']

const STATUS_COLORS = {
  'idée':      'bg-gray-100 text-gray-600',
  'à-filmer':  'bg-yellow-100 text-yellow-700',
  'filmé':     'bg-blue-100 text-blue-700',
  'monté':     'bg-purple-100 text-purple-700',
  'prêt':      'bg-orange-100 text-orange-700',
  'publié':    'bg-sage-100 text-sage-700',
}

const CATEGORY_COLORS = {
  'fertilité':             'text-pink-600',
  'grossesse':             'text-rose-500',
  'post-partum':           'text-purple-500',
  'enfant':                'text-blue-500',
  'acupuncture-pour-tous': 'text-sage-600',
  'santé-générale':        'text-teal-600',
}

const PLATFORM_ICONS = {
  instagram: '📷', tiktok: '🎵', youtube: '▶️', facebook: '👥', pinterest: '📌',
}

export default function ItemPanel({ item, onClose }) {
  const { updateItem } = useContentItems()
  const [caption, setCaption]             = useState(item.caption || '')
  const [generatingCaption, setGenerating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [saving, setSaving]               = useState(false)
  const fileInputRef = useRef(null)

  if (!item) return null

  const catClass = CATEGORY_COLORS[item.category] || 'text-gray-500'

  // Changer le statut directement
  const handleStatusChange = async (newStatus) => {
    await updateItem(item.id, { status: newStatus })
  }

  // Sauvegarder la caption éditée
  const handleSaveCaption = async () => {
    setSaving(true)
    await updateItem(item.id, { caption })
    setSaving(false)
  }

  // Upload vidéo vers Firebase Storage
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const storageRef = ref(storage, `videos/${item.id}/${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on('state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setUploadProgress(pct)
      },
      (error) => {
        console.error('Upload error:', error)
        setUploadProgress(null)
        alert('Erreur lors de l\'upload. Vérifier que Firebase Storage est activé.')
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        await updateItem(item.id, {
          videoUrl: url,
          status: item.status === 'filmé' ? 'monté' : item.status,
        })
        setUploadProgress(null)
      }
    )
  }

  // Générer une caption via Cloud Function
  const handleGenerateCaption = async () => {
    setGenerating(true)
    try {
      const functions = getFunctions()
      const generateCaption = httpsCallable(functions, 'generateCaption')
      const result = await generateCaption({
        title: item.title,
        category: item.category,
        platforms: item.platforms || ['instagram'],
        notes: item.notes || '',
      })
      const { options } = result.data
      const generated = options.join('\n\n---\n\n')
      setCaption(generated)
      await updateItem(item.id, { caption: generated })
    } catch (err) {
      console.error('Caption error:', err)
      alert('Erreur lors de la génération.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50
                      flex flex-col overflow-hidden
                      animate-slide-in">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-sand-100">
          <div className="flex-1 min-w-0 pr-3">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${catClass}`}>
              {item.category}
            </p>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">
              {item.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5 flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Statut */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    item.status === s
                      ? STATUS_COLORS[s] + ' border-transparent ring-2 ring-offset-1 ring-sage-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-sage-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Plateformes */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Plateformes</p>
            <div className="flex gap-2">
              {(item.platforms || []).map(p => (
                <span key={p} className="flex items-center gap-1 px-2 py-1 bg-sand-100 rounded-full text-xs text-gray-600">
                  {PLATFORM_ICONS[p]} {p}
                </span>
              ))}
            </div>
          </div>

          {/* Date planifiée */}
          {item.scheduledDate && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Date planifiée</p>
              <p className="text-sm text-gray-700">
                {(item.scheduledDate instanceof Date
                  ? item.scheduledDate
                  : item.scheduledDate.toDate?.()
                )?.toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-600 italic">{item.notes}</p>
            </div>
          )}

          {/* Upload vidéo */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Vidéo montée</p>
            {item.videoUrl ? (
              <div className="rounded-xl overflow-hidden border border-sand-200">
                <video
                  src={item.videoUrl}
                  controls
                  className="w-full max-h-48 bg-black"
                />
                <div className="p-2 flex justify-between items-center">
                  <span className="text-xs text-sage-600 font-medium">✓ Vidéo uploadée</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Remplacer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="w-full border-2 border-dashed border-sand-300 rounded-xl p-6
                           text-center hover:border-sage-400 hover:bg-sage-50 transition
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadProgress !== null ? (
                  <div>
                    <div className="h-2 bg-sand-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-2 bg-sage-500 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{uploadProgress}% uploadé...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl mb-1">🎬</div>
                    <p className="text-sm font-medium text-gray-600">Uploader la vidéo montée</p>
                    <p className="text-xs text-gray-400 mt-0.5">MP4, MOV — max 500MB</p>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
          </div>

          {/* Génération de caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Caption</p>
              <button
                onClick={handleGenerateCaption}
                disabled={generatingCaption}
                className="text-xs bg-sage-500 hover:bg-sage-600 disabled:opacity-50
                           text-white px-3 py-1 rounded-full font-medium transition
                           flex items-center gap-1"
              >
                {generatingCaption ? (
                  <>⏳ Génération...</>
                ) : (
                  <>✨ Générer avec l'IA</>
                )}
              </button>
            </div>
            <textarea
              className="w-full border border-sand-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
              rows={8}
              placeholder="La caption apparaîtra ici après génération, ou écris la tienne..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
            {caption && (
              <button
                onClick={handleSaveCaption}
                disabled={saving}
                className="mt-2 w-full text-xs border border-sage-200 text-sage-600
                           hover:bg-sage-50 py-1.5 rounded-lg transition font-medium"
              >
                {saving ? 'Sauvegarde...' : '💾 Sauvegarder la caption'}
              </button>
            )}
          </div>

        </div>

      </div>
    </>
  )
}
