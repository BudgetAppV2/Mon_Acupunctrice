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

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — all routes serve index.html (React Router handles routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
