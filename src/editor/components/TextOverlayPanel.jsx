import useEditorStore from '../store/useEditorStore.js'
import { formatTime } from '../utils/timeUtils.js'

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier', value: 'Courier New' },
]

const COLOR_OPTIONS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00',
  '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FF6B35', '#F7C948',
]

export default function TextOverlayPanel() {
  const textOverlays = useEditorStore(s => s.textOverlays)
  const selectedOverlayId = useEditorStore(s => s.selectedOverlayId)
  const addTextOverlay = useEditorStore(s => s.addTextOverlay)
  const updateTextOverlay = useEditorStore(s => s.updateTextOverlay)
  const removeTextOverlay = useEditorStore(s => s.removeTextOverlay)
  const selectOverlay = useEditorStore(s => s.selectOverlay)

  const selected = textOverlays.find(o => o.id === selectedOverlayId)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Texte</h3>
        <button
          onClick={addTextOverlay}
          className="text-xs bg-sage-500 hover:bg-sage-600 text-white px-3 py-1 rounded-full
                     font-medium transition"
        >
          + Ajouter
        </button>
      </div>

      {/* List of overlays */}
      {textOverlays.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          Ajoute du texte sur ta vidéo
        </p>
      )}

      <div className="space-y-2">
        {textOverlays.map(overlay => (
          <div
            key={overlay.id}
            onClick={() => selectOverlay(overlay.id)}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              selectedOverlayId === overlay.id
                ? 'border-sage-400 bg-gray-700'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white truncate">{overlay.text || 'Texte vide'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeTextOverlay(overlay.id) }}
                className="text-gray-500 hover:text-red-400 text-xs transition"
              >
                ✕
              </button>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}
            </span>
          </div>
        ))}
      </div>

      {/* Editor for selected overlay */}
      {selected && (
        <div className="border-t border-gray-700 pt-4 space-y-3">
          {/* Text content */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Contenu</label>
            <textarea
              value={selected.text}
              onChange={(e) => updateTextOverlay(selected.id, { text: e.target.value })}
              rows={2}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
            />
          </div>

          {/* Font */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Police</label>
            <select
              value={selected.fontFamily}
              onChange={(e) => updateTextOverlay(selected.id, { fontFamily: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-sage-400"
            >
              {FONT_OPTIONS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Taille: {selected.fontSize}px
            </label>
            <input
              type="range"
              min={16}
              max={120}
              value={selected.fontSize}
              onChange={(e) => updateTextOverlay(selected.id, { fontSize: Number(e.target.value) })}
              className="w-full accent-sage-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => updateTextOverlay(selected.id, { color: c })}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    selected.color === c ? 'border-sage-400 scale-110' : 'border-gray-600'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Début (s)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                value={selected.startTime}
                onChange={(e) => updateTextOverlay(selected.id, { startTime: Number(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white
                           focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fin (s)</label>
              <input
                type="number"
                step={0.1}
                min={0}
                value={selected.endTime}
                onChange={(e) => updateTextOverlay(selected.id, { endTime: Number(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white
                           focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
