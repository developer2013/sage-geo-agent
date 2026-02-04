/**
 * GEO References API Routes
 * Manages external GEO-relevant sources (research, news, competitors)
 */

import express from 'express'
import {
  addGeoReference,
  getGeoReferences,
  removeGeoReference,
  toggleGeoReference,
  getUnseenGeoReferenceAlerts,
  getGeoReferenceAlertHistory,
  markGeoReferenceAlertsSeen
} from '../services/dbService.js'
import {
  getSchedulerStatus,
  triggerManualCheck,
  getRecommendedGeoReferences
} from '../services/schedulerService.js'

const router = express.Router()

// Get all GEO references
router.get('/', (req, res) => {
  try {
    const { category } = req.query
    const references = getGeoReferences(category || null)
    res.json({ references })
  } catch (error) {
    console.error('Error fetching GEO references:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Get recommended GEO references (for easy setup)
router.get('/recommended', (req, res) => {
  try {
    const recommended = getRecommendedGeoReferences()
    res.json({ recommended })
  } catch (error) {
    console.error('Error fetching recommended references:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Add a GEO reference
router.post('/', (req, res) => {
  try {
    const { url, name, category, description, checkIntervalHours, notes } = req.body

    if (!url || !name || !category) {
      return res.status(400).json({ error: 'REFERENCES_LOAD_FAILED' })
    }

    const result = addGeoReference({
      url,
      name,
      category,
      description,
      checkIntervalHours: checkIntervalHours || 24,
      notes
    })

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Error adding GEO reference:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Remove a GEO reference
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const deleted = removeGeoReference(parseInt(id))

    if (!deleted) {
      return res.status(404).json({ error: 'REFERENCES_LOAD_FAILED' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error removing GEO reference:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Toggle GEO reference enabled state
router.patch('/:id/toggle', (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body

    toggleGeoReference(parseInt(id), enabled)
    res.json({ success: true })
  } catch (error) {
    console.error('Error toggling GEO reference:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Get unseen GEO reference alerts
router.get('/alerts/unseen', (req, res) => {
  try {
    const alerts = getUnseenGeoReferenceAlerts()
    res.json({ alerts, count: alerts.length })
  } catch (error) {
    console.error('Error fetching unseen GEO reference alerts:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Get GEO reference alert history
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const alerts = getGeoReferenceAlertHistory(limit)
    res.json({ alerts })
  } catch (error) {
    console.error('Error fetching GEO reference alert history:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Mark GEO reference alerts as seen
router.post('/alerts/seen', (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'REFERENCES_LOAD_FAILED' })
    }

    markGeoReferenceAlertsSeen(ids)
    res.json({ success: true })
  } catch (error) {
    console.error('Error marking GEO reference alerts as seen:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Get scheduler status
router.get('/scheduler/status', (req, res) => {
  try {
    const status = getSchedulerStatus()
    res.json(status)
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

// Trigger manual check
router.post('/scheduler/check', async (req, res) => {
  try {
    const results = await triggerManualCheck()
    res.json({ success: true, results })
  } catch (error) {
    console.error('Error triggering manual check:', error)
    res.status(500).json({ error: 'REFERENCES_LOAD_FAILED' })
  }
})

export default router
