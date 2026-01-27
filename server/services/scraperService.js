import * as cheerio from 'cheerio'
import {
  scrapeWithFirecrawl,
  getRobotsTxt,
  extractImageUrls,
  fetchImagesAsBase64,
  isFirecrawlAvailable
} from './firecrawlService.js'

// Helper function to create browser-like headers
function getBrowserHeaders(url, withReferer = false) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': withReferer ? 'same-origin' : 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  }

  if (withReferer) {
    const urlObj = new URL(url)
    headers['Referer'] = `${urlObj.protocol}//${urlObj.host}/`
    headers['Origin'] = `${urlObj.protocol}//${urlObj.host}`
  }

  return headers
}

/**
 * Fallback scraper using native fetch
 */
async function fetchPageContentFallback(url) {
  console.log('[Scraper] Using fallback scraper...')

  let response = await fetch(url, {
    headers: getBrowserHeaders(url, false),
    redirect: 'follow',
  })

  if (response.status === 403) {
    console.log('Got 403, retrying with Referer header...')
    response = await fetch(url, {
      headers: getBrowserHeaders(url, true),
      redirect: 'follow',
    })
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(`Die Website blockiert automatisierte Anfragen (403 Forbidden). Diese Seite hat einen Bot-Schutz aktiviert (z.B. Cloudflare, Akamai). Bitte versuche eine andere URL ohne starken Bot-Schutz.`)
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const metaTags = []
  $('meta').each((_, el) => {
    const name = $(el).attr('name')
    const property = $(el).attr('property')
    const content = $(el).attr('content')

    if (content && (name || property)) {
      metaTags.push({ name, property, content })
    }
  })

  // Extract robots meta directives (noindex, nofollow)
  const robotsMeta = extractRobotsMeta($)

  const schemaMarkup = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html())
      schemaMarkup.push(json)
    } catch (e) {
      // Invalid JSON, skip
    }
  })

  let robotsTxt = null
  try {
    const urlObj = new URL(url)
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`
    const robotsResponse = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain,*/*',
      },
    })

    if (robotsResponse.ok) {
      robotsTxt = await robotsResponse.text()
    }
  } catch (e) {
    // robots.txt not available
  }

  return {
    html,
    metaTags,
    schemaMarkup,
    robotsTxt,
    robotsMeta,
    screenshot: null,
    images: []
  }
}

/**
 * Primary function to fetch page content - uses Firecrawl if configured, otherwise fallback
 */
export async function fetchPageContent(url) {
  // Use Firecrawl if configured (no fallback - Firecrawl handles bot protection)
  if (isFirecrawlAvailable()) {
    console.log('[Scraper] Using Firecrawl...')

    // Scrape page with Firecrawl
    const firecrawlResult = await scrapeWithFirecrawl(url)

    // Get robots.txt separately
    const robotsTxt = await getRobotsTxt(url)

    // Parse rawHtml (full page with <head>) for meta tags and schema
    // rawHtml contains the complete HTML including <head> section
    const htmlForParsing = firecrawlResult.rawHtml || firecrawlResult.html
    console.log(`[Scraper] Using ${firecrawlResult.rawHtml ? 'rawHtml' : 'html'} for meta extraction, length: ${htmlForParsing.length}`)
    const $ = cheerio.load(htmlForParsing)

    const metaTags = []
    $('meta').each((_, el) => {
      const name = $(el).attr('name')
      const property = $(el).attr('property')
      const content = $(el).attr('content')

      if (content && (name || property)) {
        metaTags.push({ name, property, content })
      }
    })

    // DEBUG: Check for description meta tag
    const descriptionTag = metaTags.find(t => t.name?.toLowerCase() === 'description')
    const ogDescTag = metaTags.find(t => t.property?.toLowerCase() === 'og:description')
    console.log(`[Scraper] META DEBUG:`)
    console.log(`  - Total meta tags: ${metaTags.length}`)
    console.log(`  - Description tag: ${descriptionTag ? descriptionTag.content?.substring(0, 50) + '...' : 'NOT FOUND'}`)
    console.log(`  - OG Description: ${ogDescTag ? ogDescTag.content?.substring(0, 50) + '...' : 'NOT FOUND'}`)
    console.log(`  - First 5 tags: ${metaTags.slice(0, 5).map(t => t.name || t.property).join(', ')}`)

    const schemaMarkup = []
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html())
        schemaMarkup.push(json)
      } catch (e) {
        // Invalid JSON, skip
      }
    })

    // Extract robots meta directives (noindex, nofollow)
    const robotsMeta = extractRobotsMeta($)

    // Extract and fetch images for analysis
    const imageUrls = extractImageUrls(firecrawlResult.html, url)
    console.log(`[Scraper] Found ${imageUrls.length} images on page`)

    const images = await fetchImagesAsBase64(imageUrls, 5)
    console.log(`[Scraper] Fetched ${images.length} images for analysis`)

    // Log screenshot status
    if (firecrawlResult.screenshot) {
      console.log(`[Scraper] Screenshot available, length: ${firecrawlResult.screenshot.length}`)
    } else {
      console.log(`[Scraper] No screenshot from Firecrawl`)
    }

    // Log heading visibility data (browser-based detection)
    if (firecrawlResult.headingVisibility) {
      console.log(`[Scraper] Heading visibility from browser: ${firecrawlResult.headingVisibility.length} headings detected`)
    }

    return {
      html: firecrawlResult.html,
      rawHtml: firecrawlResult.rawHtml,  // Full HTML including <head> for Code viewer
      markdown: firecrawlResult.markdown,
      metaTags,
      schemaMarkup,
      robotsTxt,
      robotsMeta,
      screenshot: firecrawlResult.screenshot,
      images,
      metadata: firecrawlResult.metadata,
      headingVisibility: firecrawlResult.headingVisibility,  // Browser-detected visibility
      usedFirecrawl: true
    }
  }

  // Fallback to native fetch (only when Firecrawl is not configured)
  console.log('[Scraper] Firecrawl not configured, using fallback scraper')
  const fallbackResult = await fetchPageContentFallback(url)
  return {
    ...fallbackResult,
    rawHtml: fallbackResult.html,  // Fallback html IS the full raw HTML
    markdown: null,
    metadata: null,
    usedFirecrawl: false
  }
}

/**
 * Extract text content from HTML with optional browser-based heading visibility data
 * @param {string} html - Raw HTML content
 * @param {Array|null} headingVisibility - Browser-detected heading visibility (from Firecrawl actions)
 * @returns {Object} Extracted content with heading analysis
 */
export function extractTextContent(html, headingVisibility = null) {
  const $ = cheerio.load(html)

  // Remove scripts, styles, and other non-content elements
  $('script, style, noscript, iframe, svg').remove()

  // Use browser-based visibility data if available (100% accurate)
  // Otherwise fall back to static HTML analysis (best-effort)
  if (headingVisibility && Array.isArray(headingVisibility) && headingVisibility.length > 0) {
    console.log(`[Scraper] Using browser-based visibility for ${headingVisibility.length} headings`)

    // Remove headings that browser detected as hidden
    const hiddenHeadings = headingVisibility.filter(h => !h.visible)
    hiddenHeadings.forEach(hidden => {
      // Find and remove matching hidden headings from DOM
      const selector = hidden.tag.toLowerCase()
      $(selector).each((_, el) => {
        const text = $(el).text().trim()
        // Match by first 50 chars of text content
        if (text.substring(0, 50) === hidden.text.substring(0, 50)) {
          console.log(`[Scraper] Removing hidden ${hidden.tag}: "${hidden.text.substring(0, 40)}..." (reason: ${hidden.reason})`)
          $(el).remove()
        }
      })
    })
  } else {
    // Fallback: Static HTML analysis (covers ~60% of cases)
    console.log(`[Scraper] Using fallback static HTML analysis for hidden elements`)

    // Remove hidden/invisible elements before heading analysis
    // This prevents counting H1s that are:
    // - Inside <template> tags (JS framework templates)
    // - Hidden via inline styles (display:none, visibility:hidden)
    // - Hidden via common CSS classes (.hidden, .sr-only, .visually-hidden)
    // - Hidden via HTML attributes ([hidden])
    // - Inside error modals/dialogs (typically class="message" or similar)
    $('template').remove()
    $('[style*="display: none"], [style*="display:none"]').remove()
    $('[style*="visibility: hidden"], [style*="visibility:hidden"]').remove()
    $('[hidden]').remove()

    // Extended CSS class list for better fallback coverage
    const hiddenClasses = [
      '.hidden', '.sr-only', '.visually-hidden', '.screen-reader-only', '.offscreen',
      // Bootstrap
      '.d-none', '.invisible',
      // Tailwind
      '.collapse:not(.show)',
      // Common patterns
      '.hide', '.is-hidden', '.not-visible'
    ]
    $(hiddenClasses.join(', ')).remove()

    // Also remove elements with aria-hidden="true" that contain headings
    $('[aria-hidden="true"]').remove()
    // Remove error/modal H1s (common patterns: class="message", inside .modal, .dialog, .error)
    $('h1.message, .modal h1, .dialog h1, [role="dialog"] h1, [role="alertdialog"] h1').remove()
  }

  // Get the main content
  const title = $('title').text().trim()
  const h1 = $('h1').first().text().trim()
  const description = $('meta[name="description"]').attr('content') || ''

  // Get detailed headings structure with analysis
  const headings = []
  const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 }
  let questionsAsHeadings = 0

  $('h1, h2, h3, h4, h5, h6').each((index, el) => {
    const level = el.tagName.toLowerCase()
    const text = $(el).text().trim()
    const isQuestion = /\?$/.test(text) || /^(was|wie|warum|wann|wo|wer|welche|können|kann|ist|sind|hat|haben|wird|werden|what|how|why|when|where|who|which|can|is|are|has|have|will|does|do)/i.test(text)

    headingCounts[level]++
    if (isQuestion) questionsAsHeadings++

    headings.push({
      level,
      text,
      isQuestion,
      position: index + 1,
      wordCount: text.split(/\s+/).length
    })
  })

  // Analyze heading hierarchy
  const headingAnalysis = {
    counts: headingCounts,
    total: headings.length,
    questionsCount: questionsAsHeadings,
    hasProperHierarchy: headingCounts.h1 === 1 && headingCounts.h2 > 0,
    hasH1: headingCounts.h1 > 0,
    multipleH1: headingCounts.h1 > 1,
    missingLevels: []
  }

  // Check for skipped heading levels
  let lastLevel = 0
  headings.forEach(h => {
    const currentLevel = parseInt(h.level.charAt(1))
    if (currentLevel > lastLevel + 1 && lastLevel > 0) {
      headingAnalysis.missingLevels.push(`h${lastLevel + 1}`)
    }
    lastLevel = currentLevel
  })

  // Get FAQ sections
  const faqItems = []
  $('[itemtype*="FAQPage"], [itemtype*="Question"], .faq, #faq, [class*="faq"], [data-faq], .accordion, .faqs').find('h2, h3, h4, dt, [itemprop="name"], summary, .question').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 5 && text.length < 300) {
      faqItems.push(text)
    }
  })

  // Get main body text
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  // First paragraph analysis (Direct Answer check - first 40-80 words)
  const firstParagraph = $('article p, main p, .content p, .entry-content p, p').first().text().trim()
  const firstParagraphWords = firstParagraph.split(/\s+/).slice(0, 80).join(' ')

  // Check for TL;DR or Summary section
  const hasTldr = $('body').text().toLowerCase().includes('tl;dr') ||
                  $('body').text().toLowerCase().includes('zusammenfassung') ||
                  $('body').text().toLowerCase().includes('key takeaways') ||
                  $('body').text().toLowerCase().includes('auf einen blick') ||
                  $('body').text().toLowerCase().includes('das wichtigste')

  // Count statistics and numbers in content
  const statisticsMatches = bodyText.match(/\d+[\.,]?\d*\s*(%|prozent|percent|million|mio|milliarden|billion|euro|dollar|\$|€)/gi) || []
  const yearReferences = bodyText.match(/\b(20[2-3]\d|19\d{2})\b/g) || []
  const hasRecentYear = yearReferences.some(y => parseInt(y) >= 2024)

  // Check for citations and sources
  const citationPatterns = bodyText.match(/(laut|according to|quelle|source|studie|study|research|forschung|bericht|report)[\s:]+[A-Z][a-zA-ZäöüÄÖÜß\s]+/gi) || []
  const hasExternalLinks = $('a[href^="http"]:not([href*="' + new URL('http://example.com').hostname + '"])').length

  // Count lists (important for GEO)
  const bulletLists = $('ul').length
  const numberedLists = $('ol').length
  const totalListItems = $('li').length

  // Check for tables
  const tables = $('table').length

  // Author information
  const authorInfo = {
    hasAuthor: false,
    authorName: null,
    hasAuthorBio: false
  }

  const authorSelectors = [
    '[rel="author"]', '.author', '.byline', '[itemprop="author"]',
    '.post-author', '.article-author', '.autor', '.verfasser'
  ]

  authorSelectors.forEach(selector => {
    const authorEl = $(selector).first()
    if (authorEl.length) {
      authorInfo.hasAuthor = true
      authorInfo.authorName = authorEl.text().trim().substring(0, 100)
    }
  })

  // Check for author bio
  if ($('.author-bio, .author-description, .author-info, [itemprop="description"]').length) {
    authorInfo.hasAuthorBio = true
  }

  // Date/Freshness check
  const dateInfo = {
    hasPublishDate: false,
    hasModifiedDate: false,
    publishDate: null,
    modifiedDate: null
  }

  const publishDate = $('[itemprop="datePublished"], time[datetime], .publish-date, .post-date, .entry-date').first()
  if (publishDate.length) {
    dateInfo.hasPublishDate = true
    dateInfo.publishDate = publishDate.attr('datetime') || publishDate.text().trim()
  }

  const modifiedDate = $('[itemprop="dateModified"]').first()
  if (modifiedDate.length) {
    dateInfo.hasModifiedDate = true
    dateInfo.modifiedDate = modifiedDate.attr('datetime') || modifiedDate.text().trim()
  }

  // Word count
  const wordCount = bodyText.split(/\s+/).length

  // Image analysis for alt-text quality
  const imageAnalysis = {
    total: $('img').length,
    withAlt: $('img[alt]').filter((_, el) => $(el).attr('alt').trim().length > 0).length,
    withoutAlt: 0,
    altTexts: []
  }
  imageAnalysis.withoutAlt = imageAnalysis.total - imageAnalysis.withAlt

  $('img[alt]').each((_, el) => {
    const alt = $(el).attr('alt').trim()
    if (alt.length > 0) {
      imageAnalysis.altTexts.push(alt.substring(0, 100))
    }
  })

  // Content structure score elements
  const structureAnalysis = {
    hasLists: bulletLists > 0 || numberedLists > 0,
    bulletLists,
    numberedLists,
    totalListItems,
    hasTables: tables > 0,
    tableCount: tables,
    hasImages: $('img').length,
    hasVideos: $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
    hasTldr,
    hasStatistics: statisticsMatches.length > 0,
    statisticsCount: statisticsMatches.length,
    hasCitations: citationPatterns.length > 0,
    citationsCount: citationPatterns.length,
    hasExternalLinks: hasExternalLinks > 0,
    externalLinksCount: hasExternalLinks,
    hasRecentData: hasRecentYear,
    wordCount,
    estimatedReadTime: Math.ceil(wordCount / 200),
    imageAnalysis
  }

  return {
    title,
    h1,
    description,
    headings,
    headingAnalysis,
    faqItems,
    bodyText: bodyText.substring(0, 8000),
    firstParagraph: firstParagraphWords,
    authorInfo,
    dateInfo,
    structureAnalysis
  }
}

/**
 * Extract robots meta directives from HTML
 * Checks both generic "robots" and specific bot meta tags (googlebot, bingbot)
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Object} Robots meta information
 */
function extractRobotsMeta($) {
  const result = {
    hasNoindex: false,
    hasNofollow: false,
    hasNone: false, // "none" = noindex + nofollow
    directives: [],
    rawTags: []
  }

  // Bot-specific meta names to check
  const robotsMetaNames = ['robots', 'googlebot', 'bingbot', 'googlebot-news']

  robotsMetaNames.forEach(metaName => {
    const content = $(`meta[name="${metaName}" i]`).attr('content')
    if (content) {
      const lowerContent = content.toLowerCase()
      result.rawTags.push({ name: metaName, content })

      // Parse directives
      const directives = lowerContent.split(',').map(d => d.trim())

      directives.forEach(directive => {
        if (!result.directives.includes(directive)) {
          result.directives.push(directive)
        }

        if (directive === 'noindex') {
          result.hasNoindex = true
        } else if (directive === 'nofollow') {
          result.hasNofollow = true
        } else if (directive === 'none') {
          result.hasNone = true
          result.hasNoindex = true
          result.hasNofollow = true
        }
      })
    }
  })

  // Also check X-Robots-Tag in HTTP headers (would need to be passed separately)
  // For now, we only check meta tags

  return result
}
