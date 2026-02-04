import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { fetchPageContent } from '../services/scraperService.js'
import { analyzeWithClaude } from '../services/aiService.js'
import { saveAnalysis, getRecentAnalysisByUrl } from '../services/dbService.js'

const router = express.Router()

/**
 * POST /api/compare
 * Compare multiple URLs and return a structured comparison
 *
 * Body: { urls: string[], forceRefresh?: boolean }
 * Returns: Comparison object with scores, differences, and insights
 */
router.post('/', async (req, res) => {
  try {
    const { urls, forceRefresh = false } = req.body

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length < 2) {
      return res.status(400).json({
        error: 'MIN_URLS_REQUIRED'
      })
    }

    if (urls.length > 5) {
      return res.status(400).json({
        error: 'MAX_URLS_EXCEEDED'
      })
    }

    // Validate and normalize URLs
    const validatedUrls = []
    for (const url of urls) {
      try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
        validatedUrls.push(parsed.href)
      } catch {
        return res.status(400).json({
          error: 'INVALID_URL'
        })
      }
    }

    console.log(`[Compare] Comparing ${validatedUrls.length} URLs`)

    // Analyze all URLs (use cache if available)
    const analysisPromises = validatedUrls.map(async (url) => {
      // Check cache first
      if (!forceRefresh) {
        const cached = getRecentAnalysisByUrl(url, 24)
        if (cached) {
          console.log(`[Compare] Using cached analysis for: ${url}`)
          return { ...cached, fromCache: true }
        }
      }

      // Perform fresh analysis
      console.log(`[Compare] Analyzing: ${url}`)
      try {
        const pageCode = await fetchPageContent(url)
        const analysisResult = await analyzeWithClaude(url, null, pageCode)

        // Calculate basic content stats
        const $ = cheerio.load(pageCode.html)
        $('script, style, noscript').remove()
        const wordCount = $('body').text().split(/\s+/).filter(w => w.length > 0).length

        const analysis = {
          id: uuidv4(),
          url,
          analyzedAt: new Date().toISOString(),
          geoScore: analysisResult.geoScore,
          scoreSummary: analysisResult.scoreSummary,
          strengths: analysisResult.strengths || [],
          weaknesses: analysisResult.weaknesses || [],
          recommendations: analysisResult.recommendations || [],
          contentStats: { wordCount },
          fromCache: false
        }

        // Save to DB for future caching
        saveAnalysis({
          ...analysis,
          nextStep: analysisResult.nextStep || '',
          pageCode: {
            html: pageCode.html,
            markdown: pageCode.markdown || null,
            metaTags: pageCode.metaTags,
            schemaMarkup: pageCode.schemaMarkup,
            robotsTxt: pageCode.robotsTxt,
            metadata: pageCode.metadata || null,
            usedFirecrawl: pageCode.usedFirecrawl || false
          }
        })

        return analysis
      } catch (error) {
        console.error(`[Compare] Error analyzing ${url}:`, error.message)
        return {
          url,
          error: error.message,
          geoScore: null
        }
      }
    })

    const analyses = await Promise.all(analysisPromises)

    // Build comparison result
    const successfulAnalyses = analyses.filter(a => a.geoScore !== null)
    const failedAnalyses = analyses.filter(a => a.geoScore === null)

    if (successfulAnalyses.length < 2) {
      return res.status(400).json({
        error: 'MIN_URLS_REQUIRED',
        failed: failedAnalyses
      })
    }

    // Sort by score (highest first)
    successfulAnalyses.sort((a, b) => b.geoScore - a.geoScore)

    // Calculate statistics
    const scores = successfulAnalyses.map(a => a.geoScore)
    const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)

    // Find unique strengths and weaknesses
    const allStrengths = new Map()
    const allWeaknesses = new Map()

    successfulAnalyses.forEach(analysis => {
      analysis.strengths?.forEach(s => {
        const key = s.title.toLowerCase()
        if (!allStrengths.has(key)) {
          allStrengths.set(key, { ...s, urls: [] })
        }
        allStrengths.get(key).urls.push(analysis.url)
      })

      analysis.weaknesses?.forEach(w => {
        const key = w.title.toLowerCase()
        if (!allWeaknesses.has(key)) {
          allWeaknesses.set(key, { ...w, urls: [] })
        }
        allWeaknesses.get(key).urls.push(analysis.url)
      })
    })

    // Find what the top performer has that others don't
    const topPerformer = successfulAnalyses[0]
    const topStrengthTitles = new Set(topPerformer.strengths?.map(s => s.title.toLowerCase()) || [])

    const missingFromOthers = []
    successfulAnalyses.slice(1).forEach(analysis => {
      const theirStrengths = new Set(analysis.strengths?.map(s => s.title.toLowerCase()) || [])
      const missing = [...topStrengthTitles].filter(s => !theirStrengths.has(s))

      if (missing.length > 0) {
        missingFromOthers.push({
          url: analysis.url,
          geoScore: analysis.geoScore,
          scoreDiff: topPerformer.geoScore - analysis.geoScore,
          missingStrengths: missing.map(m => {
            const strength = topPerformer.strengths?.find(s => s.title.toLowerCase() === m)
            return strength?.title || m
          })
        })
      }
    })

    const comparison = {
      timestamp: new Date().toISOString(),
      urlCount: validatedUrls.length,
      successCount: successfulAnalyses.length,
      failedCount: failedAnalyses.length,

      // Rankings
      rankings: successfulAnalyses.map((a, index) => ({
        rank: index + 1,
        url: a.url,
        geoScore: a.geoScore,
        scoreSummary: a.scoreSummary,
        fromCache: a.fromCache,
        strengthCount: a.strengths?.length || 0,
        weaknessCount: a.weaknesses?.length || 0
      })),

      // Statistics
      statistics: {
        average: avgScore,
        highest: maxScore,
        lowest: minScore,
        spread: maxScore - minScore
      },

      // Winner analysis
      winner: {
        url: topPerformer.url,
        geoScore: topPerformer.geoScore,
        strengths: topPerformer.strengths,
        keyAdvantages: missingFromOthers.length > 0
          ? `Hat ${missingFromOthers[0].missingStrengths.length} Staerken, die anderen fehlen`
          : 'Keine eindeutigen Vorteile identifiziert'
      },

      // What others are missing
      improvements: missingFromOthers,

      // Common issues across all
      commonWeaknesses: [...allWeaknesses.values()]
        .filter(w => w.urls.length >= Math.ceil(successfulAnalyses.length / 2))
        .map(w => ({ title: w.title, priority: w.priority, affectedUrls: w.urls.length })),

      // Failed analyses
      failed: failedAnalyses.map(f => ({ url: f.url, error: f.error })),

      // Full analysis data (for detailed view)
      fullAnalyses: successfulAnalyses.map(a => ({
        url: a.url,
        geoScore: a.geoScore,
        scoreSummary: a.scoreSummary,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        recommendations: a.recommendations?.slice(0, 3), // Top 3 recommendations
        fromCache: a.fromCache
      }))
    }

    console.log(`[Compare] Comparison complete. Winner: ${topPerformer.url} (${topPerformer.geoScore})`)

    res.json(comparison)
  } catch (error) {
    console.error('[Compare] Error:', error)
    res.status(500).json({
      error: 'COMPARISON_FAILED'
    })
  }
})

export default router
