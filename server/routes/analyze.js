import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import * as cheerio from 'cheerio'
import { fetchPageContent } from '../services/scraperService.js'
import { analyzeWithClaude } from '../services/aiService.js'
import { saveAnalysis, getRecentAnalysisByUrl, updateMonitoredUrlScore } from '../services/dbService.js'

const router = express.Router()

/**
 * Calculate content statistics from HTML
 * Uses deduplication to count unique images and links only
 */
function calculateContentStats(html, baseUrl) {
  const $ = cheerio.load(html)

  // Remove script and style elements for text extraction
  $('script, style, noscript').remove()

  // Get text content and count words
  const textContent = $('body').text()
  const words = textContent.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  // Domains to exclude (YouTube embeds, tracking pixels, etc.)
  const excludedDomains = [
    'youtube.com', 'youtu.be', 'ytimg.com',
    'google-analytics.com', 'googletagmanager.com',
    'facebook.com', 'twitter.com', 'linkedin.com',
    'doubleclick.net', 'googlesyndication.com'
  ]

  const isExcludedUrl = (url) => {
    if (!url) return true
    // Exclude data URIs and empty sources
    if (url.startsWith('data:') || url === '') return true
    // Exclude tracking pixels (1x1 images)
    if (url.includes('1x1') || url.includes('pixel')) return true
    // Exclude YouTube and other embed domains
    try {
      const hostname = new URL(url, baseUrl).hostname
      return excludedDomains.some(domain => hostname.includes(domain))
    } catch {
      return false
    }
  }

  // Count unique images (deduplicated, excluding embeds/tracking)
  const uniqueImageUrls = new Set()
  let imagesWithAlt = 0
  let imagesWithoutAlt = 0

  $('img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src')
    if (!src || isExcludedUrl(src)) return

    // Normalize URL for deduplication
    let normalizedSrc = src
    try {
      const urlObj = new URL(src, baseUrl)
      // Remove query params for deduplication (same image, different size params)
      normalizedSrc = urlObj.origin + urlObj.pathname
    } catch {
      normalizedSrc = src
    }

    if (!uniqueImageUrls.has(normalizedSrc)) {
      uniqueImageUrls.add(normalizedSrc)
      const alt = $(img).attr('alt')
      if (alt && alt.trim().length > 0) {
        imagesWithAlt++
      } else {
        imagesWithoutAlt++
      }
    }
  })

  const imageCount = uniqueImageUrls.size

  // Count unique links (deduplicated)
  const uniqueInternalLinks = new Set()
  const uniqueExternalLinks = new Set()

  try {
    const baseHost = new URL(baseUrl).hostname
    $('a[href]').each((_, link) => {
      const href = $(link).attr('href')
      if (!href || href === '#' || href.startsWith('javascript:')) return
      if (isExcludedUrl(href)) return

      try {
        let normalizedHref = href
        let isInternal = false

        // Handle relative URLs
        if (href.startsWith('/') || !href.includes('://')) {
          isInternal = true
          normalizedHref = href.split('?')[0].split('#')[0] // Remove query/hash
        } else {
          const linkUrl = new URL(href)
          const linkHost = linkUrl.hostname
          isInternal = linkHost === baseHost || linkHost.endsWith('.' + baseHost)
          normalizedHref = linkUrl.origin + linkUrl.pathname
        }

        if (isInternal) {
          uniqueInternalLinks.add(normalizedHref)
        } else {
          uniqueExternalLinks.add(normalizedHref)
        }
      } catch {
        // Invalid URL, count as internal
        uniqueInternalLinks.add(href)
      }
    })
  } catch {
    // If baseUrl parsing fails, just count all links as internal
    $('a[href]').each((_, link) => {
      const href = $(link).attr('href')
      if (href && href !== '#') {
        uniqueInternalLinks.add(href)
      }
    })
  }

  const internalLinks = uniqueInternalLinks.size
  const externalLinks = uniqueExternalLinks.size

  // Count headings
  const headingStructure = {
    h1: $('h1').length,
    h2: $('h2').length,
    h3: $('h3').length,
    h4: $('h4').length,
    h5: $('h5').length,
    h6: $('h6').length
  }

  // Count lists and tables
  const listCount = $('ul, ol').length
  const tableCount = $('table').length

  // Estimate read time (average 200 words per minute)
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200))

  return {
    wordCount,
    imageCount,
    imagesWithAlt,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    headingStructure,
    listCount,
    tableCount,
    estimatedReadTime
  }
}

/**
 * Calculate performance metrics based on content analysis
 */
function calculatePerformanceMetrics(html, contentStats) {
  const htmlSize = Buffer.byteLength(html, 'utf8')

  // Estimate image sizes (rough average: 50KB per image)
  const estimatedImageSize = contentStats.imageCount * 50 * 1024

  const contentSize = {
    html: htmlSize,
    images: estimatedImageSize,
    total: htmlSize + estimatedImageSize
  }

  // Estimate LCP based on content size
  let estimatedLCP = 'fast'
  if (contentSize.total > 2 * 1024 * 1024) { // > 2MB
    estimatedLCP = 'slow'
  } else if (contentSize.total > 500 * 1024) { // > 500KB
    estimatedLCP = 'moderate'
  }

  // Estimate CLS based on images without dimensions and content structure
  let estimatedCLS = 'good'
  if (contentStats.imagesWithoutAlt > 5) {
    // Many images without alt often correlates with missing dimensions
    estimatedCLS = 'needs-improvement'
  }
  if (contentStats.imageCount > 20 && contentStats.imagesWithoutAlt > contentStats.imageCount * 0.5) {
    estimatedCLS = 'poor'
  }

  // Generate suggestions
  const suggestions = []

  if (htmlSize > 100 * 1024) {
    suggestions.push('HTML-Groesse reduzieren durch Minifizierung und Komprimierung')
  }

  if (contentStats.imageCount > 10) {
    suggestions.push('Bilder lazy-loaden fuer schnellere initiale Ladezeit')
  }

  if (contentStats.imagesWithoutAlt > 0) {
    suggestions.push(`${contentStats.imagesWithoutAlt} Bilder ohne Alt-Text hinzufuegen`)
  }

  if (contentStats.headingStructure.h1 === 0) {
    suggestions.push('H1-Ueberschrift fuer bessere Seitenstruktur hinzufuegen')
  } else if (contentStats.headingStructure.h1 > 1) {
    suggestions.push('Nur eine H1-Ueberschrift pro Seite verwenden')
  }

  if (contentStats.wordCount < 300) {
    suggestions.push('Content erweitern - mindestens 300 Woerter empfohlen')
  }

  if (contentStats.externalLinks > contentStats.internalLinks * 2 && contentStats.externalLinks > 5) {
    suggestions.push('Mehr interne Verlinkungen fuer bessere Navigation hinzufuegen')
  }

  return {
    estimatedLCP,
    estimatedCLS,
    contentSize,
    suggestions
  }
}

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

    // Calculate content stats and performance metrics
    const contentStats = calculateContentStats(pageCode.html, validUrl.href)
    const performanceMetrics = calculatePerformanceMetrics(pageCode.html, contentStats)

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
      contentStats,
      performanceMetrics,
      pageCode: {
        html: pageCode.html,
        markdown: pageCode.markdown || null,  // For better Claude chat context
        metaTags: pageCode.metaTags,
        schemaMarkup: pageCode.schemaMarkup,
        robotsTxt: pageCode.robotsTxt,
        metadata: pageCode.metadata || null,  // Title, description from Firecrawl
        usedFirecrawl: pageCode.usedFirecrawl || false
      }
    }

    saveAnalysis(analysis)

    // Update monitored URL score if being tracked
    const monitorResult = updateMonitoredUrlScore(analysis.url, analysis.geoScore)
    if (monitorResult?.alerted) {
      console.log(`[Monitor] Alert created for ${analysis.url}: ${monitorResult.change > 0 ? '+' : ''}${monitorResult.change} (${monitorResult.alertType})`)
    }

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

    // Calculate content stats and performance metrics
    const contentStats = calculateContentStats(pageCode.html, validUrl.href)
    const performanceMetrics = calculatePerformanceMetrics(pageCode.html, contentStats)

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
      contentStats,
      performanceMetrics,
      pageCode: {
        html: pageCode.html,
        markdown: pageCode.markdown || null,  // For better Claude chat context
        metaTags: pageCode.metaTags,
        schemaMarkup: pageCode.schemaMarkup,
        robotsTxt: pageCode.robotsTxt,
        metadata: pageCode.metadata || null,  // Title, description from Firecrawl
        usedFirecrawl: pageCode.usedFirecrawl || false
      }
    }

    saveAnalysis(analysis)

    // Update monitored URL score if being tracked
    const monitorResult = updateMonitoredUrlScore(analysis.url, analysis.geoScore)
    if (monitorResult?.alerted) {
      console.log(`[Monitor] Alert created for ${analysis.url}: ${monitorResult.change > 0 ? '+' : ''}${monitorResult.change} (${monitorResult.alertType})`)
    }

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
