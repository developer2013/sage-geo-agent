import FirecrawlApp from '@mendable/firecrawl-js'

// Lazy initialization of Firecrawl client
let firecrawl = null

function getFirecrawlClient() {
  if (!firecrawl && process.env.FIRECRAWL_API_KEY) {
    firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    })
  }
  return firecrawl
}

/**
 * Scrape a URL using Firecrawl with screenshot and full content
 */
export async function scrapeWithFirecrawl(url) {
  const client = getFirecrawlClient()
  if (!client) {
    throw new Error('Firecrawl client not initialized')
  }

  try {
    console.log(`[Firecrawl] Scraping: ${url}`)

    const result = await client.scrape(url, {
      formats: ['markdown', 'html', 'screenshot', 'links'],
      onlyMainContent: false,
      waitFor: 2000,
    })

    if (!result.success) {
      throw new Error(result.error || 'Firecrawl scrape failed')
    }

    console.log(`[Firecrawl] Successfully scraped: ${url}`)

    return {
      html: result.html || '',
      markdown: result.markdown || '',
      screenshot: result.screenshot || null,
      links: result.links || [],
      metadata: result.metadata || {},
      success: true
    }
  } catch (error) {
    console.error(`[Firecrawl] Error scraping ${url}:`, error.message)
    throw error
  }
}

/**
 * Fetch robots.txt from a URL
 */
export async function getRobotsTxt(url) {
  const client = getFirecrawlClient()
  if (!client) {
    return null
  }

  try {
    const urlObj = new URL(url)
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`

    console.log(`[Firecrawl] Fetching robots.txt: ${robotsUrl}`)

    const result = await client.scrape(robotsUrl, {
      formats: ['markdown'],
      onlyMainContent: false,
    })

    if (result.success && result.markdown) {
      return result.markdown
    }

    return null
  } catch (error) {
    console.log(`[Firecrawl] robots.txt not available: ${error.message}`)
    return null
  }
}

/**
 * Extract image URLs from HTML content
 */
export function extractImageUrls(html, baseUrl) {
  const images = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi
  const imgRegex2 = /<img[^>]*(?:alt=["']([^"']*)["'])?[^>]+src=["']([^"']+)["'][^>]*>/gi

  let match
  const seenUrls = new Set()

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    const alt = match[2] || ''

    if (isValidImageUrl(src) && !seenUrls.has(src)) {
      seenUrls.add(src)
      images.push({
        src,
        alt,
        absoluteUrl: resolveUrl(src, baseUrl)
      })
    }
  }

  while ((match = imgRegex2.exec(html)) !== null) {
    const alt = match[1] || ''
    const src = match[2]

    if (isValidImageUrl(src) && !seenUrls.has(src)) {
      seenUrls.add(src)
      images.push({
        src,
        alt,
        absoluteUrl: resolveUrl(src, baseUrl)
      })
    }
  }

  return images
}

function isValidImageUrl(url) {
  if (!url) return false
  if (url.startsWith('data:')) return false
  if (url.includes('1x1') || url.includes('pixel') || url.includes('tracking')) return false

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.avif']
  const lowercaseUrl = url.toLowerCase()

  return imageExtensions.some(ext => lowercaseUrl.includes(ext))
}

function resolveUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).href
  } catch {
    return relativeUrl
  }
}

/**
 * Fetch images as base64 for Claude Vision analysis
 */
export async function fetchImagesAsBase64(images, maxImages = 5) {
  const fetchedImages = []
  const imagesToFetch = images.slice(0, maxImages)

  for (const img of imagesToFetch) {
    try {
      const response = await fetch(img.absoluteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/*',
        }
      })

      if (!response.ok) continue

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) continue

      const arrayBuffer = await response.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      if (base64.length < 1000) continue
      if (base64.length > 5 * 1024 * 1024) continue

      fetchedImages.push({
        ...img,
        base64,
        mediaType: contentType.split(';')[0]
      })

      console.log(`[Firecrawl] Fetched image: ${img.absoluteUrl.substring(0, 50)}...`)
    } catch (error) {
      console.log(`[Firecrawl] Could not fetch image: ${img.absoluteUrl}`)
    }
  }

  return fetchedImages
}

/**
 * Check if Firecrawl is configured and available
 */
export function isFirecrawlAvailable() {
  return !!process.env.FIRECRAWL_API_KEY
}
