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
 * Convert our subtitle format to @remotion/captions Caption[] format
 * Our subtitles: { id, text, startTime (seconds), endTime (seconds) }
 * Remotion expects: { text, startMs, endMs, timestampMs, confidence }
 */
function toRemotionCaptions(subtitles) {
  return subtitles.map(sub => ({
    text: sub.text,
    startMs: Math.round(sub.startTime * 1000),
    endMs: Math.round(sub.endTime * 1000),
    timestampMs: Math.round(sub.startTime * 1000),
    confidence: 1,
  }))
}

/**
 * Generate TikTok-style pages from our subtitles.
 * Each page has .tokens[] with individual word timing.
 *
 * @param {Array} subtitles - Our subtitle objects
 * @returns {Array<TikTokPage>} Pages with .text, .startMs, .durationMs, .tokens[]
 */
export function generateTikTokPages(subtitles) {
  if (!subtitles.length) return []

  const remotionCaptions = toRemotionCaptions(subtitles)
  const { pages } = createTikTokStyleCaptions({
    captions: remotionCaptions,
    combineTokensWithinMilliseconds: 800,
  })
  return pages
}

/**
 * For a given time (seconds), find the current TikTok page and active token
 *
 * @param {Array} pages - TikTok pages from generateTikTokPages()
 * @param {number} timeSeconds - Current playback time in seconds
 * @returns {{ page: TikTokPage|null, activeTokenIndex: number }} Current page and active token index
 */
export function getActivePageAndToken(pages, timeSeconds) {
  const timeMs = timeSeconds * 1000

  for (const page of pages) {
    const pageEnd = page.startMs + page.durationMs
    if (timeMs >= page.startMs && timeMs < pageEnd) {
      // Find active token
      let activeTokenIndex = -1
      for (let i = 0; i < page.tokens.length; i++) {
        if (timeMs >= page.tokens[i].fromMs && timeMs < page.tokens[i].toMs) {
          activeTokenIndex = i
          break
        }
        // If between tokens, highlight the last token that has passed
        if (timeMs >= page.tokens[i].fromMs) {
          activeTokenIndex = i
        }
      }
      return { page, activeTokenIndex }
    }
  }
  return { page: null, activeTokenIndex: -1 }
}

/**
 * Draw animated subtitle on a 2D canvas context (for WebCodecs export)
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} style - SUBTITLE_STYLES[key]
 * @param {Object} page - TikTokPage
 * @param {number} activeTokenIndex - Currently active token
 * @param {Object} outputSize - { width, height }
 */
export function drawAnimatedSubtitle(ctx, style, page, activeTokenIndex, outputSize) {
  const scale = outputSize.width / 1080
  const fontSize = style.fontSize * scale
  const centerX = outputSize.width / 2
  const baseY = outputSize.height * 0.85

  ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Draw background if style has one
  if (style.backgroundColor) {
    const metrics = ctx.measureText(page.text)
    const padX = 16 * scale
    const padY = 8 * scale
    const bgX = centerX - metrics.width / 2 - padX
    const bgY = baseY - fontSize / 2 - padY
    const bgW = metrics.width + padX * 2
    const bgH = fontSize + padY * 2
    ctx.fillStyle = style.backgroundColor
    ctx.beginPath()
    ctx.roundRect(bgX, bgY, bgW, bgH, 8 * scale)
    ctx.fill()
  }

  if (!style.animated) {
    // Static: draw full text
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = style.strokeColor
      ctx.lineWidth = style.strokeWidth * scale
      ctx.strokeText(page.text, centerX, baseY)
    }
    ctx.fillStyle = style.color
    ctx.fillText(page.text, centerX, baseY)
  } else {
    // Animated: draw word by word with active highlight
    // First measure total width to center the line
    const totalWidth = ctx.measureText(page.text).width
    let x = centerX - totalWidth / 2

    for (let i = 0; i < page.tokens.length; i++) {
      const token = page.tokens[i]
      const isActive = i <= activeTokenIndex
      const tokenWidth = ctx.measureText(token.text).width

      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor
        ctx.lineWidth = style.strokeWidth * scale
        ctx.textAlign = 'left'
        ctx.strokeText(token.text, x, baseY)
      }

      ctx.fillStyle = isActive ? style.activeColor : style.color
      ctx.textAlign = 'left'
      ctx.fillText(token.text, x, baseY)

      x += tokenWidth
    }
  }

  // Reset alignment
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'
}
