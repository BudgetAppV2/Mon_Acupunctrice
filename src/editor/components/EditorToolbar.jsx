import { useNavigate } from 'react-router-dom'
import useEditorStore from '../store/useEditorStore.js'

export default function EditorToolbar({ onExport }) {
  const navigate = useNavigate()
  const contentItem = useEditorStore(s => s.contentItem)
  const videoUrl = useEditorStore(s => s.videoUrl)
  const isExporting = useEditorStore(s => s.isExporting)
  const exportedUrl = useEditorStore(s => s.exportedUrl)

  const handleBack = () => {
    navigate('/idees')
  }

  return (
    <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
      >
        <span className="text-lg">&larr;</span>
        <span className="hidden sm:inline">Retour</span>
      </button>

      {/* Title */}
      <div className="text-center flex-1 min-w-0 px-4">
        <h1 className="text-sm font-medium truncate">
          {contentItem?.title || 'Nouvel éditeur'}
        </h1>
        {contentItem?.category && (
          <p className="text-xs text-gray-400 capitalize">{contentItem.category}</p>
        )}
      </div>

      {/* Export button */}
      <div className="flex items-center gap-2">
        {exportedUrl && (
          <a
            href={exportedUrl}
            download={`${contentItem?.title || 'video'}.mp4`}
            className="text-xs bg-sage-600 hover:bg-sage-700 text-white px-3 py-1.5 rounded-full font-medium transition"
          >
            Telecharger
          </a>
        )}
        <button
          onClick={onExport}
          disabled={!videoUrl || isExporting}
          className="text-xs bg-sage-500 hover:bg-sage-600 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white px-4 py-1.5 rounded-full font-medium transition flex items-center gap-1"
        >
          {isExporting ? 'Export...' : 'Exporter'}
        </button>
      </div>
    </div>
  )
}
