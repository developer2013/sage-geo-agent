import * as cheerio from 'cheerio'

export async function fetchPageContent(url) {
  try {
    // Fetch the main page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SageGEOBot/1.0; +https://sage-geo-agent.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract meta tags
    const metaTags = []
    $('meta').each((_, el) => {
      const name = $(el).attr('name')
      const property = $(el).attr('property')
      const content = $(el).attr('content')

      if (content && (name || property)) {
        metaTags.push({ name, property, content })
      }
    })

    // Extract JSON-LD schema markup
    const schemaMarkup = []
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html())
        schemaMarkup.push(json)
      } catch (e) {
        // Invalid JSON, skip
      }
    })

    // Try to fetch robots.txt
    let robotsTxt = null
    try {
      const urlObj = new URL(url)
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`
      const robotsResponse = await fetch(robotsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SageGEOBot/1.0)',
        },
        timeout: 10000,
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
      robotsTxt
    }
  } catch (error) {
    throw new Error(`Failed to fetch page: ${error.message}`)
  }
}

export function extractTextContent(html) {
  const $ = cheerio.load(html)

  // Remove scripts, styles, and other non-content elements
  $('script, style, noscript, iframe, svg').remove()

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
    estimatedReadTime: Math.ceil(wordCount / 200)
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
