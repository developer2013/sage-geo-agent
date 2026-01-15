import express from 'express'
import { getAvailableAudiences, getBrandContext } from '../services/prompts/brandPrompt.js'

const router = express.Router()

/**
 * GET /api/brand/audiences
 * Get available target audiences for the dropdown
 */
router.get('/audiences', (req, res) => {
  try {
    const audiences = getAvailableAudiences()
    res.json({ audiences })
  } catch (error) {
    console.error('Error fetching audiences:', error)
    res.status(500).json({ error: 'Konnte Zielgruppen nicht laden' })
  }
})

/**
 * GET /api/brand/context
 * Get full brand context (for debugging/admin)
 */
router.get('/context', (req, res) => {
  try {
    const context = getBrandContext()
    res.json(context)
  } catch (error) {
    console.error('Error fetching brand context:', error)
    res.status(500).json({ error: 'Konnte Brand-Kontext nicht laden' })
  }
})

export default router
