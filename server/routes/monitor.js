import express from 'express'
import {
  addMonitoredUrl,
  removeMonitoredUrl,
  getMonitoredUrls,
  getUnseenAlerts,
  getAlertHistory,
  markAlertsSeen,
  toggleMonitoredUrl
} from '../services/dbService.js'

const router = express.Router()

// Get all monitored URLs
router.get('/urls', (req, res) => {
  try {
    const urls = getMonitoredUrls()
    res.json({ urls })
  } catch (error) {
    console.error('Error fetching monitored URLs:', error)
    res.status(500).json({ error: 'Konnte ueberwachte URLs nicht laden' })
  }
})

// Add URL to monitoring
router.post('/urls', (req, res) => {
  try {
    const { url, name, alertThreshold } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL ist erforderlich' })
    }

    const result = addMonitoredUrl(url, name, alertThreshold || 5)

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    res.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Error adding monitored URL:', error)
    res.status(500).json({ error: 'Konnte URL nicht hinzufuegen' })
  }
})

// Remove URL from monitoring
router.delete('/urls/:id', (req, res) => {
  try {
    const { id } = req.params
    const deleted = removeMonitoredUrl(parseInt(id))

    if (!deleted) {
      return res.status(404).json({ error: 'URL nicht gefunden' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error removing monitored URL:', error)
    res.status(500).json({ error: 'Konnte URL nicht entfernen' })
  }
})

// Toggle monitoring for a URL
router.patch('/urls/:id/toggle', (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body

    toggleMonitoredUrl(parseInt(id), enabled)
    res.json({ success: true })
  } catch (error) {
    console.error('Error toggling monitored URL:', error)
    res.status(500).json({ error: 'Konnte Status nicht aendern' })
  }
})

// Get unseen alerts (for notification badge)
router.get('/alerts/unseen', (req, res) => {
  try {
    const alerts = getUnseenAlerts()
    res.json({ alerts, count: alerts.length })
  } catch (error) {
    console.error('Error fetching unseen alerts:', error)
    res.status(500).json({ error: 'Konnte Alerts nicht laden' })
  }
})

// Get alert history
router.get('/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const alerts = getAlertHistory(limit)
    res.json({ alerts })
  } catch (error) {
    console.error('Error fetching alert history:', error)
    res.status(500).json({ error: 'Konnte Alert-Historie nicht laden' })
  }
})

// Mark alerts as seen
router.post('/alerts/seen', (req, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Alert-IDs sind erforderlich' })
    }

    markAlertsSeen(ids)
    res.json({ success: true })
  } catch (error) {
    console.error('Error marking alerts as seen:', error)
    res.status(500).json({ error: 'Konnte Alerts nicht aktualisieren' })
  }
})

export default router
