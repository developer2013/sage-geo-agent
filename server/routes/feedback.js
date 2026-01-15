import express from 'express'
import {
  recordRecommendationFeedback,
  getRecommendationStats,
  incrementRecommendationShown
} from '../services/dbService.js'

const router = express.Router()

/**
 * POST /api/feedback
 * Record anonymous feedback for a recommendation
 *
 * Body: { recommendationType: string, action: 'helpful' | 'implemented' | 'dismissed' }
 *
 * Privacy: NO user IDs, NO session IDs, NO URLs - only aggregated counters
 */
router.post('/', async (req, res) => {
  try {
    const { recommendationType, action } = req.body

    // Validate input
    if (!recommendationType || typeof recommendationType !== 'string') {
      return res.status(400).json({ error: 'recommendationType ist erforderlich' })
    }

    if (!['helpful', 'implemented', 'dismissed'].includes(action)) {
      return res.status(400).json({
        error: 'Ungueltige Aktion. Erlaubt: helpful, implemented, dismissed'
      })
    }

    // Normalize recommendation type (lowercase, trim)
    const normalizedType = recommendationType.toLowerCase().trim()

    // Record the feedback
    recordRecommendationFeedback(normalizedType, action)

    console.log(`[Feedback] Recorded: ${action} for "${normalizedType}"`)

    res.json({ success: true })
  } catch (error) {
    console.error('[Feedback] Error:', error.message)
    res.status(500).json({ error: 'Feedback konnte nicht gespeichert werden' })
  }
})

/**
 * POST /api/feedback/shown
 * Record that a recommendation was shown to a user
 *
 * Body: { recommendationType: string }
 */
router.post('/shown', async (req, res) => {
  try {
    const { recommendationType } = req.body

    if (!recommendationType || typeof recommendationType !== 'string') {
      return res.status(400).json({ error: 'recommendationType ist erforderlich' })
    }

    const normalizedType = recommendationType.toLowerCase().trim()
    incrementRecommendationShown(normalizedType)

    res.json({ success: true })
  } catch (error) {
    console.error('[Feedback] Error recording shown:', error.message)
    res.status(500).json({ error: 'Konnte nicht aufzeichnen' })
  }
})

/**
 * GET /api/feedback/stats
 * Get aggregated recommendation statistics
 *
 * Returns effectiveness scores and feedback counts for all recommendation types
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = getRecommendationStats()

    res.json({
      stats,
      total: stats.length,
      // Summary stats
      summary: {
        totalFeedbackEvents: stats.reduce((sum, s) =>
          sum + s.helpfulCount + s.implementedCount + s.dismissedCount, 0
        ),
        topPerforming: stats.slice(0, 5).map(s => ({
          type: s.recommendationType,
          score: s.effectivenessScore
        })),
        needsImprovement: stats.filter(s => s.effectivenessScore < 0.8).map(s => ({
          type: s.recommendationType,
          score: s.effectivenessScore
        }))
      }
    })
  } catch (error) {
    console.error('[Feedback] Error getting stats:', error.message)
    res.status(500).json({ error: 'Statistiken konnten nicht geladen werden' })
  }
})

export default router
