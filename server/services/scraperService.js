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

  // Get headings structure
  const headings = []
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headings.push({
      level: el.tagName.toLowerCase(),
      text: $(el).text().trim()
    })
  })

  // Get FAQ sections
  const faqItems = []
  $('[itemtype*="FAQPage"], [itemtype*="Question"], .faq, #faq, [class*="faq"]').find('h2, h3, h4, dt, [itemprop="name"]').each((_, el) => {
    faqItems.push($(el).text().trim())
  })

  // Get main body text (limited)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000)

  return {
    title,
    h1,
    description,
    headings,
    faqItems,
    bodyText
  }
}
