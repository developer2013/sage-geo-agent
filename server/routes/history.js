import express from 'express'
import { getAnalyses, getAnalysisById, deleteAnalysis } from '../services/dbService.js'

const router = express.Router()

// Get all analyses (list)
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const analyses = getAnalyses(limit)
    res.json({ analyses })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'Konnte Historie nicht laden' })
  }
})

// Get single analysis by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const analysis = getAnalysisById(id)

    if (!analysis) {
      return res.status(404).json({ error: 'Analyse nicht gefunden' })
    }

    res.json(analysis)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    res.status(500).json({ error: 'Konnte Analyse nicht laden' })
  }
})

// Delete analysis by ID
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const deleted = deleteAnalysis(id)

    if (!deleted) {
      return res.status(404).json({ error: 'Analyse nicht gefunden' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    res.status(500).json({ error: 'Konnte Analyse nicht loeschen' })
  }
})

export default router
