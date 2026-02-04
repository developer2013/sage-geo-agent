import express from 'express'
import { getAnalyses, getAnalysisById, deleteAnalysis, getUrlHistory, compareAnalyses } from '../services/dbService.js'

const router = express.Router()

// Get all analyses (list)
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const analyses = getAnalyses(limit)
    res.json({ analyses })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'HISTORY_LOAD_FAILED' })
  }
})

// Get single analysis by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const analysis = getAnalysisById(id)

    if (!analysis) {
      return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' })
    }

    res.json(analysis)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    res.status(500).json({ error: 'HISTORY_LOAD_FAILED' })
  }
})

// Delete analysis by ID
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const deleted = deleteAnalysis(id)

    if (!deleted) {
      return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    res.status(500).json({ error: 'ANALYSIS_DELETE_FAILED' })
  }
})

// ==========================================
// URL HISTORY & VERSION COMPARISON
// ==========================================

/**
 * GET /api/history/url/:encodedUrl
 * Get all analyses for a specific URL (version history)
 */
router.get('/url/:encodedUrl', (req, res) => {
  try {
    const url = decodeURIComponent(req.params.encodedUrl)
    const limit = parseInt(req.query.limit) || 20

    const history = getUrlHistory(url, limit)

    if (history.length === 0) {
      return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' })
    }

    // Calculate trend data
    const scores = history.map(h => h.geoScore)
    const latestScore = scores[0]
    const previousScore = scores[1] || scores[0]
    const oldestScore = scores[scores.length - 1]

    res.json({
      url,
      versionCount: history.length,
      versions: history,
      trend: {
        latest: latestScore,
        previous: previousScore,
        oldest: oldestScore,
        recentChange: latestScore - previousScore,
        totalChange: latestScore - oldestScore,
        improving: latestScore > oldestScore
      }
    })
  } catch (error) {
    console.error('Error fetching URL history:', error)
    res.status(500).json({ error: 'HISTORY_LOAD_FAILED' })
  }
})

/**
 * GET /api/history/compare/:oldId/:newId
 * Compare two analyses and return differences
 */
router.get('/compare/:oldId/:newId', (req, res) => {
  try {
    const { oldId, newId } = req.params

    const comparison = compareAnalyses(oldId, newId)

    if (!comparison) {
      return res.status(404).json({ error: 'ANALYSIS_NOT_FOUND' })
    }

    res.json(comparison)
  } catch (error) {
    console.error('Error comparing analyses:', error)
    res.status(500).json({ error: 'COMPARISON_FAILED' })
  }
})

export default router
