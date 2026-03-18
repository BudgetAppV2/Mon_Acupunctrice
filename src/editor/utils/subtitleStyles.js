/**
 * Subtitle style presets and TikTok-style word-by-word rendering
 * Uses @remotion/captions for tokenized page generation
 */
import { createTikTokStyleCaptions } from '@remotion/captions'

/**
 * Style preset definitions
 */
export const SUBTITLE_STYLES = {
  classic: {
    id: 'classic',
    label: 'Classique',
    description: 'Blanc sur fond sombre',
    // Rendering config
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 28,            // base size at 1080w
    color: '#FFFFFF',
    activeColor: '#FFFFFF',   // same — no highlight for classic
    strokeColor: '#000000',
    strokeWidth: 3,
    backgroundColor: null,
    animated: false,          // static display — no word-by-word
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Jaune animé mot par mot',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 34,
    color: '#FFFFFF',
    activeColor: '#FFE135',   // yellow highlight for active word
    strokeColor: '#000000',
    strokeWidth: 4,
    backgroundColor: null,
    animated: true,
  },
  karaoke: {
    id: 'karaoke',
    label: 'Karaoké',
    description: 'Fond coloré, mot actif en surbrillance',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 32,
    color: '#FFFFFF',
    activeColor: '#00FF88',   // green highlight for active word
    strokeColor: 'transparent',
    strokeWidth: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    animated: true,
  },
}

/**
 * Group individual word subtitles into natural speech-pause groups
 * using @remotion/captions for TikTok-style display.
 *
 * @param {Array} wordSubtitles - Individual word subtitles from CF: { id, text, startTime, endTime }
 * @param {number} combineMs - Max gap between words to combine (default 1200ms)
 * @returns {Array} Grouped subtitles: { id, text, startTime, endTime, words[] }
 */
export function groupSubtitleWords(wordSubtitles, combineMs = 1200) {
  if (!wordSubtitles.length) return []

  // Convert to @remotion/captions format (text needs leading space per docs)
  const captions = wordSubtitles.map(s => ({
    text: ' ' + s.text,
    startMs: Math.round(s.startTime * 1000),
    endMs: Math.round(s.endTime * 1000),
    timestampMs: Math.round(s.startTime * 1000),
    confidence: null,
  }))

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: combineMs,
  })

  return pages.map((page, i) => {
    const words = page.tokens.map(token => ({
      word: token.text.trim(),
      start: token.fromMs / 1000,
      end: token.toMs / 1000,
    }))
    return {
      id: `group_${i}`,
      text: words.map(w => w.word).join(' '),
      startTime: page.startMs / 1000,
      endTime: (page.startMs + page.durationMs) / 1000,
      words,
    }
  })
}

/**
 * Draw subtitle on a 2D canvas context (for WebCodecs/FFmpeg export)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} style - SUBTITLE_STYLES[key]
 * @param {Object} subtitle - Grouped subtitle { text, words[] }
 * @param {number} activeWordIndex - Currently active word index
 * @param {Object} outputSize - { width, height }
 * @param {Object} config - { x, y, fontSize } from subtitleConfig
 */
export function drawSubtitleOnCanvas(ctx, style, subtitle, activeWordIndex, outputSize, config = {}) {
  const scale = outputSize.width / 1080
  const fontSize = (config.fontSize || style.fontSize) * scale
  const centerX = outputSize.width * (config.x || 0.5)
  const baseY = outputSize.height * (config.y || 0.85)

  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Draw background if style has one
  if (style.backgroundColor) {
    const metrics = ctx.measureText(subtitle.text)
    const padX = 16 * scale
    const padY = 8 * scale
    ctx.fillStyle = style.backgroundColor
    ctx.beginPath()
    ctx.roundRect(
      centerX - metrics.width / 2 - padX,
      baseY - fontSize / 2 - padY,
      metrics.width + padX * 2,
      fontSize + padY * 2,
      8 * scale
    )
    ctx.fill()
  }

  if (!style.animated || !subtitle.words?.length) {
    // Static: draw full text
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor
      ctx.lineWidth = style.strokeWidth * scale
      ctx.strokeText(subtitle.text, centerX, baseY)
    }
    ctx.fillStyle = style.color
    ctx.fillText(subtitle.text, centerX, baseY)
  } else {
    // Animated: draw word by word with active highlight
    const totalWidth = ctx.measureText(subtitle.text).width
    let x = centerX - totalWidth / 2

    for (let i = 0; i < subtitle.words.length; i++) {
      const wordText = i < subtitle.words.length - 1
        ? subtitle.words[i].word + ' '
        : subtitle.words[i].word
      const isActive = i <= activeWordIndex
      const wordWidth = ctx.measureText(wordText).width

      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor
        ctx.lineWidth = style.strokeWidth * scale
        ctx.textAlign = 'left'
        ctx.strokeText(wordText, x, baseY)
      }

      ctx.fillStyle = isActive ? style.activeColor : style.color
      ctx.textAlign = 'left'
      ctx.fillText(wordText, x, baseY)

      x += wordWidth
    }
  }

  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
}
