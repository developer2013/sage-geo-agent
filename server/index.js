import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import analyzeRouter from './routes/analyze.js'
import historyRouter from './routes/history.js'
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
