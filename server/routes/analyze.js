import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { fetchPageContent } from '../services/scraperService.js'
import { analyzeWithClaude } from '../services/aiService.js'
import { saveAnalysis } from '../services/dbService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL ist erforderlich' })
    }

    // Validate URL
    let validUrl
    try {
      validUrl = new URL(url)
    } catch {
      return res.status(400).json({ error: 'Ungueltige URL' })
    }

    console.log(`Analyzing: ${validUrl.href}`)

    // Fetch page content
    const pageCode = await fetchPageContent(validUrl.href)

    // Analyze with Claude
    const analysisResult = await analyzeWithClaude(validUrl.href, null, pageCode)

    // Create full analysis object
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
      pageCode: {
        html: pageCode.html,
        metaTags: pageCode.metaTags,
        schemaMarkup: pageCode.schemaMarkup,
        robotsTxt: pageCode.robotsTxt,
        usedFirecrawl: pageCode.usedFirecrawl || false
      }
    }

    // Save to database
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
