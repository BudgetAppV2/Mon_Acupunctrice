import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useEditorStore from './store/useEditorStore.js'
import { useContentItems } from '../hooks/useContentItems.js'
import EditorToolbar from './components/EditorToolbar.jsx'
import VideoPreview from './components/VideoPreview.jsx'
import VideoTrimmer from './components/VideoTrimmer.jsx'
import TextOverlayPanel from './components/TextOverlayPanel.jsx'
import SubtitlePanel from './components/SubtitlePanel.jsx'
import AudioPanel from './components/AudioPanel.jsx'
import ImportModal from './components/ImportModal.jsx'
import ExportModal from './components/ExportModal.jsx'
import Timeline from './components/Timeline.jsx'

const PANELS = [
  { id: 'trim',      label: 'Trim',       icon: '✂️' },
  { id: 'text',      label: 'Texte',      icon: 'Aa' },
  { id: 'subtitles', label: 'Sous-titres', icon: '💬' },
  { id: 'audio',     label: 'Audio',      icon: '🎵' },
]

export default function EditorPage() {
  const { id } = useParams()
  const { items } = useContentItems()
  const [showExport, setShowExport] = useState(false)

  const setContentItem = useEditorStore(s => s.setContentItem)
  const loadVideo = useEditorStore(s => s.loadVideo)
  const videoUrl = useEditorStore(s => s.videoUrl)
  const showImportModal = useEditorStore(s => s.showImportModal)
  const setShowImportModal = useEditorStore(s => s.setShowImportModal)
  const activePanel = useEditorStore(s => s.activePanel)
  const setActivePanel = useEditorStore(s => s.setActivePanel)
  const isExporting = useEditorStore(s => s.isExporting)
  const reset = useEditorStore(s => s.reset)

  // Load content item from Firestore
  useEffect(() => {
    if (!id || !items.length) return
    const item = items.find(i => i.id === id)
    if (item) {
      setContentItem(id, item)
      // If item already has a video, load it
      if (item.videoUrl && !videoUrl) {
        loadVideo(null, item.videoUrl)
      }
    }
  }, [id, items, setContentItem, loadVideo, videoUrl])

  // Show import modal if no video
  useEffect(() => {
    if (!videoUrl && id) {
      const timeout = setTimeout(() => {
        const item = items.find(i => i.id === id)
        if (!item?.videoUrl) {
          setShowImportModal(true)
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [videoUrl, id, items, setShowImportModal])

  // Cleanup on unmount
  useEffect(() => {
    return () => reset()
  }, [reset])

  // Handle export button click from toolbar
  const handleExportClick = () => setShowExport(true)

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-30">
      {/* Toolbar */}
      <EditorToolbar onExport={handleExportClick} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Preview area — capped at 45vh on mobile so tools stay visible */}
        <div className="flex items-center justify-center p-2 lg:p-4 min-h-0
                        max-h-[45vh] lg:max-h-none lg:flex-1">
          <VideoPreview />
        </div>

        {/* Side panel (desktop: right side, mobile: below preview) */}
        <div className="lg:w-80 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700
                        flex flex-col flex-shrink-0 min-h-0 flex-1 lg:flex-none">
          {/* Panel tabs — always visible, never scrolls */}
          <div className="flex border-b border-gray-700 flex-shrink-0">
            {PANELS.map(panel => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`flex-1 py-2 lg:py-2.5 text-xs font-medium text-center transition ${
                  activePanel === panel.id
                    ? 'text-sage-400 border-b-2 border-sage-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="block text-base mb-0.5">{panel.icon}</span>
                <span className="hidden sm:inline">{panel.label}</span>
              </button>
            ))}
          </div>

          {/* Active panel content — scrollable */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {activePanel === 'trim' && <VideoTrimmer />}
            {activePanel === 'text' && <TextOverlayPanel />}
            {activePanel === 'subtitles' && <SubtitlePanel />}
            {activePanel === 'audio' && <AudioPanel />}
          </div>
        </div>
      </div>

      {/* Timeline — scrollable horizontally */}
      <div className="flex-shrink-0">
        <Timeline />
      </div>

      {/* Import modal */}
      {showImportModal && <ImportModal />}

      {/* Export modal */}
      {(showExport || isExporting) && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
    </div>
  )
}
