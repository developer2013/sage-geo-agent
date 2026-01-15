import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import analyzeRouter from './routes/analyze.js'
import historyRouter from './routes/history.js'
import chatRouter from './routes/chat.js'
import feedbackRouter from './routes/feedback.js'
import compareRouter from './routes/compare.js'
import monitorRouter from './routes/monitor.js'
import brandRouter from './routes/brand.js'
import { initDatabase } from './services/dbService.js'

dotenv.config({ path: '../.env' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// API Routes
app.use('/api/analyze', analyzeRouter)
app.use('/api/history', historyRouter)
app.use('/api/chat', chatRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/compare', compareRouter)
app.use('/api/monitor', monitorRouter)
app.use('/api/brand', brandRouter)

// Health check (must be before catch-all)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Serve static files - always serve if dist folder exists
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))

// Catch-all route for SPA - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
