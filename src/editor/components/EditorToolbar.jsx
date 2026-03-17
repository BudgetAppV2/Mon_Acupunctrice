import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEditorStore from '../store/useEditorStore.js'
import { useContentItems } from '../../hooks/useContentItems.js'

export default function EditorToolbar({ onExport }) {
  const navigate = useNavigate()
  const { updateItem } = useContentItems()
  const contentItem = useEditorStore(s => s.contentItem)
  const contentItemId = useEditorStore(s => s.contentItemId)
  const videoUrl = useEditorStore(s => s.videoUrl)
  const isExporting = useEditorStore(s => s.isExporting)
  const exportedUrl = useEditorStore(s => s.exportedUrl)
  const setContentItem = useEditorStore(s => s.setContentItem)

  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleBack = () => {
    navigate('/idees')
  }

  const handleDateChange = async (e) => {
    const dateStr = e.target.value
    if (!dateStr || !contentItemId) return

    const date = new Date(dateStr + 'T12:00:00')
    await updateItem(contentItemId, {
      scheduledDate: date,
      status: 'schedulé',
    })
    // Update local store so UI reflects immediately
    setContentItem(contentItemId, {
      ...contentItem,
      scheduledDate: date,
      status: 'schedulé',
    })
    setShowDatePicker(false)
  }

  // Format existing date for display
  const scheduledStr = contentItem?.scheduledDate
    ? new Date(contentItem.scheduledDate).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="bg-gray-900 text-white px-4 py-0 h-full flex items-center justify-between border-b border-gray-700">
      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition flex-shrink-0"
      >
        <span className="text-lg">&larr;</span>
        <span className="hidden sm:inline">Retour</span>
      </button>

      {/* Title + date */}
      <div className="text-center flex-1 min-w-0 px-3">
        <h1 className="text-sm font-medium truncate">
          {contentItem?.title || 'Nouvel éditeur'}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-0.5">
          {contentItem?.category && (
            <span className="text-xs text-gray-400 capitalize">{contentItem.category}</span>
          )}
          {scheduledStr && (
            <span className="text-xs text-sage-400">{scheduledStr}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Date picker trigger */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-full transition
                       hover:bg-gray-700"
            title="Planifier la publication"
          >
            &#128197;
          </button>
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-1 z-50">
              <input
                type="date"
                onChange={handleDateChange}
                defaultValue={contentItem?.scheduledDate
                  ? new Date(contentItem.scheduledDate).toISOString().split('T')[0]
                  : ''}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white
                           focus:outline-none focus:ring-2 focus:ring-sage-400"
                autoFocus
              />
            </div>
          )}
        </div>

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
