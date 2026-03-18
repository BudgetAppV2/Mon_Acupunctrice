import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// COOP/COEP headers — required for SharedArrayBuffer (FFmpeg.wasm multi-thread)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next()
})

// Proxy for Firebase Storage images — bypasses COEP blocking
// COEP: require-corp blocks cross-origin images that don't send
// Cross-Origin-Resource-Policy header. Firebase Storage doesn't send it.
app.get('/proxy-image', async (req, res) => {
  const url = req.query.url
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com/')) {
    return res.status(400).send('URL invalide')
  }
  try {
    const response = await fetch(url)
    if (!response.ok) return res.status(response.status).send('Fetch failed')
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).send('Proxy error')
  }
})

// Proxy for Firebase Storage videos — streaming with range request support
// HTML5 <video> uses range requests for seeking; we forward them to Firebase
app.get('/proxy-video', async (req, res) => {
  const url = req.query.url
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com/')) {
    return res.status(400).send('URL invalide')
  }
  try {
    const headers = {}
    if (req.headers.range) {
      headers['Range'] = req.headers.range
    }
    const response = await fetch(url, { headers })
    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send('Fetch failed')
    }
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Accept-Ranges', 'bytes')
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'))
    }
    if (response.headers.get('content-range')) {
      res.setHeader('Content-Range', response.headers.get('content-range'))
      res.status(206)
    }
    // Stream the response body to the client
    const reader = response.body.getReader()
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { res.end(); break }
        res.write(value)
      }
    }
    pump().catch(err => {
      console.error('Proxy video stream error:', err)
      res.end()
    })
  } catch (err) {
    console.error('Proxy video error:', err)
    res.status(500).send('Proxy error')
  }
})

// Proxy for external audio (Jamendo, etc.) — bypasses COEP blocking
app.get('/proxy-audio', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).send('URL invalide')
  try {
    const response = await fetch(url)
    if (!response.ok) return res.status(response.status).send('Fetch failed')
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Accept-Ranges', 'bytes')
    if (response.headers.get('content-length')) {
      res.setHeader('Content-Length', response.headers.get('content-length'))
    }
    const reader = response.body.getReader()
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { res.end(); break }
        res.write(value)
      }
    }
    pump().catch(err => {
      console.error('Proxy audio stream error:', err)
      res.end()
    })
  } catch (err) {
    console.error('Proxy audio error:', err)
    res.status(500).send('Proxy error')
  }
})

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — all routes serve index.html (React Router handles routing)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
