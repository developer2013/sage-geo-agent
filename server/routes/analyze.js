import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { fetchPageContent } from '../services/scraperService.js'
import { analyzeWithClaude } from '../services/aiService.js'
import { saveAnalysis, getRecentAnalysisByUrl } from '../services/dbService.js'

const router = express.Router()

// Streaming analysis endpoint with progress updates
router.post('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  const sendProgress = (step, message) => {
    res.write(`data: ${JSON.stringify({ type: 'progress', step, message })}\n\n`)
  }

  try {
    const { url, forceRefresh } = req.body

    if (!url) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'URL ist erforderlich' })}\n\n`)
      res.end()
      return
    }

    let validUrl
    try {
      validUrl = new URL(url)
    } catch {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Ungueltige URL' })}\n\n`)
      res.end()
      return
    }

    // Check for cached analysis (unless force refresh)
    if (!forceRefresh) {
      sendProgress(1, 'Prüfe Cache...')
      const cached = getRecentAnalysisByUrl(validUrl.href, 24)
      if (cached) {
        console.log(`[Analyze] Returning cached analysis for: ${validUrl.href}`)
        res.write(`data: ${JSON.stringify({ type: 'complete', analysis: cached })}\n\n`)
        res.end()
        return
      }
    }

    sendProgress(1, 'Lade Webseite...')
    console.log(`Analyzing: ${validUrl.href}`)

    const pageCode = await fetchPageContent(validUrl.href)

    sendProgress(2, 'Analysiere mit KI...')
    console.log(`[Analyze] Screenshot available: ${!!pageCode.screenshot}`)

    const analysisResult = await analyzeWithClaude(validUrl.href, null, pageCode)

    sendProgress(3, 'Erstelle Bericht...')

    const analysis = {
      id: uuidv4(),
      url: validUrl.href,
      analyzedAt: new Date().toISOString(),
      geoScore: analysisResult.geoScore,
      scoreSummary: analysisResult.scoreSummary,
      strengths: analysisResult.strengths || [],
      weaknesses: analysisResult.weaknesses || [],
      recommendations: analysisResult.recommendations || [],
      nextStep: analysisResult.nextStep || '',
      imageAnalysis: analysisResult.imageAnalysis || null,
      ctaAnalysis: analysisResult.ctaAnalysis || null,
      tableAnalysis: analysisResult.tableAnalysis || null,
      pageCode: {
        html: pageCode.html,
        metaTags: pageCode.metaTags,
        schemaMarkup: pageCode.schemaMarkup,
        robotsTxt: pageCode.robotsTxt,
        usedFirecrawl: pageCode.usedFirecrawl || false
      }
    }

    saveAnalysis(analysis)
    console.log(`Analysis complete: ${validUrl.href} - Score: ${analysis.geoScore}`)

    res.write(`data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`)
    res.end()
  } catch (error) {
    console.error('Analysis error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Analyse fehlgeschlagen' })}\n\n`)
    res.end()
  }
})

// Regular endpoint (kept for compatibility)
router.post('/', async (req, res) => {
  try {
    const { url, forceRefresh } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL ist erforderlich' })
    }

    let validUrl
    try {
      validUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: 'Ungueltige URL' })
    }

    // Check for cached analysis (unless force refresh)
    if (!forceRefresh) {
      const cached = getRecentAnalysisByUrl(validUrl.href, 24)
      if (cached) {
        console.log(`[Analyze] Returning cached analysis for: ${validUrl.href}`)
        return res.json(cached)
      }
    }

    console.log(`Analyzing: ${validUrl.href}`)

    const pageCode = await fetchPageContent(validUrl.href)

    console.log(`[Analyze] Screenshot available: ${!!pageCode.screenshot}`)
    console.log(`[Analyze] Images available: ${pageCode.images?.length || 0}`)

    const analysisResult = await analyzeWithClaude(validUrl.href, null, pageCode)

    const analysis = {
      id: uuidv4(),
      url: validUrl.href,
      analyzedAt: new Date().toISOString(),
      geoScore: analysisResult.geoScore,
      scoreSummary: analysisResult.scoreSummary,
      strengths: analysisResult.strengths || [],
      weaknesses: analysisResult.weaknesses || [],
      recommendations: analysisResult.recommendations || [],
      nextStep: analysisResult.nextStep || '',
      imageAnalysis: analysisResult.imageAnalysis || null,
      ctaAnalysis: analysisResult.ctaAnalysis || null,
      tableAnalysis: analysisResult.tableAnalysis || null,
      pageCode: {
        html: pageCode.html,
        metaTags: pageCode.metaTags,
        schemaMarkup: pageCode.schemaMarkup,
        robotsTxt: pageCode.robotsTxt,
        usedFirecrawl: pageCode.usedFirecrawl || false
      }
    }

    saveAnalysis(analysis)
    console.log(`Analysis complete: ${validUrl.href} - Score: ${analysis.geoScore}`)

    res.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({
      error: error.message || 'Analyse fehlgeschlagen'
    })
  }
})

export default router
