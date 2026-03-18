import { create } from 'zustand'
import { generateId } from '../utils/timeUtils.js'

const useEditorStore = create((set, get) => ({
  // ─── Source content item ───────────────────────
  contentItemId: null,
  contentItem: null,

  // ─── Video source ──────────────────────────────
  videoFile: null,
  videoUrl: null,
  videoDuration: 0,
  videoWidth: 0,
  videoHeight: 0,

  // ─── Playback ──────────────────────────────────
  currentTime: 0,
  isPlaying: false,

  // ─── Trim ──────────────────────────────────────
  trimStart: 0,
  trimEnd: 0,

  // ─── Text overlays ─────────────────────────────
  textOverlays: [],
  selectedOverlayId: null,

  // ─── Subtitles ─────────────────────────────────
  subtitles: [],
  subtitlesVisible: true,
  generatingSubtitles: false,
  subtitleStyle: 'classic', // 'classic' | 'tiktok' | 'karaoke'
  subtitleConfig: { x: 0.5, y: 0.85, fontSize: 52 },

  // ─── Audio track ───────────────────────────────
  audioFile: null,
  audioUrl: null,
  audioVolume: 0.5,
  originalAudioVolume: 1,

  // ─── Export ────────────────────────────────────
  isExporting: false,
  exportProgress: 0,
  exportedUrl: null,
  exportedBlob: null,

  // ─── UI state ──────────────────────────────────
  activePanel: 'trim', // 'trim' | 'text' | 'subtitles' | 'audio' | null
  timelineZoom: 1,
  showImportModal: false,

  // ═══════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════

  // ─── Content item ──────────────────────────────
  setContentItem: (id, item) => set({
    contentItemId: id,
    contentItem: item,
  }),

  // ─── Video ─────────────────────────────────────
  loadVideo: (file, url) => set({
    videoFile: file,
    videoUrl: url,
    showImportModal: false,
    trimStart: 0,
    trimEnd: 0,
    currentTime: 0,
    exportedUrl: null,
    exportedBlob: null,
  }),

  setVideoDimensions: (width, height, duration) => {
    const safeDuration = (duration && isFinite(duration)) ? duration : 0
    set({
      videoWidth: width,
      videoHeight: height,
      videoDuration: safeDuration,
      trimEnd: safeDuration,
    })
  },

  clearVideo: () => set({
    videoFile: null,
    videoUrl: null,
    videoDuration: 0,
    videoWidth: 0,
    videoHeight: 0,
    trimStart: 0,
    trimEnd: 0,
    currentTime: 0,
  }),

  // ─── Playback ──────────────────────────────────
  setCurrentTime: (t) => set({ currentTime: t }),
  seekTo: (t) => set({ currentTime: t, _seekRequest: t }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),

  // ─── Trim ──────────────────────────────────────
  setTrimStart: (t) => set({ trimStart: t }),
  setTrimEnd: (t) => set({ trimEnd: t }),
  setTrim: (start, end) => set({ trimStart: start, trimEnd: end }),

  // ─── Text overlays ─────────────────────────────
  addTextOverlay: () => {
    const { videoDuration, trimStart, trimEnd } = get()
    const safeEnd = (trimEnd && isFinite(trimEnd)) ? trimEnd
      : (videoDuration && isFinite(videoDuration)) ? videoDuration
      : 10 // fallback 10s if duration unknown
    const overlay = {
      id: generateId(),
      text: 'Texte',
      x: 0.5,
      y: 0.5,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      startTime: trimStart,
      endTime: safeEnd,
    }
    set(s => ({
      textOverlays: [...s.textOverlays, overlay],
      selectedOverlayId: overlay.id,
    }))
  },

  updateTextOverlay: (id, updates) => set(s => ({
    textOverlays: s.textOverlays.map(o => o.id === id ? { ...o, ...updates } : o),
  })),

  removeTextOverlay: (id) => set(s => ({
    textOverlays: s.textOverlays.filter(o => o.id !== id),
    selectedOverlayId: s.selectedOverlayId === id ? null : s.selectedOverlayId,
  })),

  selectOverlay: (id) => set({ selectedOverlayId: id }),
  deselectOverlay: () => set({ selectedOverlayId: null }),

  // ─── Subtitles ─────────────────────────────────
  setSubtitles: (subs) => set({ subtitles: subs }),
  toggleSubtitles: () => set(s => ({ subtitlesVisible: !s.subtitlesVisible })),
  setGeneratingSubtitles: (v) => set({ generatingSubtitles: v }),
  setSubtitleStyle: (style) => set({ subtitleStyle: style }),
  setSubtitleConfig: (updates) => set(s => ({
    subtitleConfig: { ...s.subtitleConfig, ...updates },
  })),

  updateSubtitle: (id, updates) => set(s => ({
    subtitles: s.subtitles.map(sub => sub.id === id ? { ...sub, ...updates } : sub),
  })),

  removeSubtitle: (id) => set(s => ({
    subtitles: s.subtitles.filter(sub => sub.id !== id),
  })),

  // ─── Audio ─────────────────────────────────────
  setAudio: (file, url) => set({
    audioFile: file,
    audioUrl: url,
  }),

  clearAudio: () => set({
    audioFile: null,
    audioUrl: null,
  }),

  setAudioVolume: (v) => set({ audioVolume: v }),
  setOriginalAudioVolume: (v) => set({ originalAudioVolume: v }),

  // ─── Export ────────────────────────────────────
  setExporting: (v) => set({ isExporting: v }),
  setExportProgress: (v) => set({ exportProgress: v }),
  setExported: (url, blob) => set({ exportedUrl: url, exportedBlob: blob, isExporting: false }),
  clearExport: () => set({ exportedUrl: null, exportedBlob: null, exportProgress: 0 }),

  // ─── UI ────────────────────────────────────────
  setActivePanel: (panel) => set({ activePanel: panel }),
  setTimelineZoom: (z) => set({ timelineZoom: z }),
  setShowImportModal: (v) => set({ showImportModal: v }),

  // ─── Reset ─────────────────────────────────────
  reset: () => set({
    contentItemId: null,
    contentItem: null,
    videoFile: null,
    videoUrl: null,
    videoDuration: 0,
    videoWidth: 0,
    videoHeight: 0,
    currentTime: 0,
    isPlaying: false,
    trimStart: 0,
    trimEnd: 0,
    textOverlays: [],
    selectedOverlayId: null,
    subtitles: [],
    subtitlesVisible: true,
    generatingSubtitles: false,
    subtitleStyle: 'classic',
    subtitleConfig: { x: 0.5, y: 0.85, fontSize: 52 },
    audioFile: null,
    audioUrl: null,
    audioVolume: 0.5,
    originalAudioVolume: 1,
    isExporting: false,
    exportProgress: 0,
    exportedUrl: null,
    exportedBlob: null,
    activePanel: 'trim',
    timelineZoom: 1,
    showImportModal: false,
  }),
}))

export default useEditorStore
