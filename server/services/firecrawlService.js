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
 * JavaScript to execute in browser for accurate visibility detection
 * Uses real browser APIs: getComputedStyle, offsetParent, getBoundingClientRect
 * This catches ALL hidden elements: CSS classes, parent visibility, JS-generated styles
 */
const VISIBILITY_DETECTION_SCRIPT = `
(function() {
  return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    // Comprehensive visibility check using browser APIs
    const hasVisibleParent = el.offsetParent !== null;
    const isDisplayed = style.display !== 'none';
    const isVisible = style.visibility !== 'hidden';
    const hasOpacity = parseFloat(style.opacity) > 0;
    const hasSize = rect.width > 0 && rect.height > 0;

    // Element is truly visible only if ALL conditions are met
    const visible = hasVisibleParent && isDisplayed && isVisible && hasOpacity && hasSize;

    // Determine why element is hidden (for debugging/logging)
    let reason = null;
    if (!visible) {
      if (!hasVisibleParent) reason = 'hidden-parent';
      else if (!isDisplayed) reason = 'display-none';
      else if (!isVisible) reason = 'visibility-hidden';
      else if (!hasOpacity) reason = 'opacity-zero';
      else if (!hasSize) reason = 'zero-size';
      else reason = 'unknown';
    }

    return {
      tag: el.tagName,
      text: el.textContent.trim().substring(0, 200),
      visible: visible,
      reason: reason
    };
  });
})();
`

/**
 * Scrape a URL using Firecrawl with screenshot and full content
 * Includes browser-based visibility detection via executeJavascript
 */
export async function scrapeWithFirecrawl(url) {
  const client = getFirecrawlClient()
  if (!client) {
    throw new Error('Firecrawl client not initialized')
  }

  try {
    console.log(`[Firecrawl] Scraping: ${url}`)

    const result = await client.scrape(url, {
      formats: ['markdown', 'html', 'rawHtml', 'screenshot', 'links'],
      onlyMainContent: false,
      waitFor: 3000,
      actions: [
        {
          type: 'executeJavascript',
          script: VISIBILITY_DETECTION_SCRIPT
        }
      ]
    })

    console.log(`[Firecrawl] Result keys:`, Object.keys(result || {}))

    // Handle different response formats from Firecrawl SDK
    const doc = result?.data || result

    if (!doc || (!doc.html && !doc.markdown)) {
      console.error(`[Firecrawl] Empty or invalid response:`, JSON.stringify(result).substring(0, 500))
      throw new Error(result?.error || 'Firecrawl returned empty response')
    }

    // Handle screenshot - Firecrawl returns a URL, we need to download it as base64
    let screenshotBase64 = null
    if (doc.screenshot) {
      console.log(`[Firecrawl] Screenshot URL received: ${doc.screenshot.substring(0, 80)}...`)

      // If it's a URL, download and convert to base64
      if (doc.screenshot.startsWith('http')) {
        try {
          console.log(`[Firecrawl] Downloading screenshot from URL...`)
          const screenshotResponse = await fetch(doc.screenshot, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': 'image/*',
            }
          })

          if (screenshotResponse.ok) {
            const arrayBuffer = await screenshotResponse.arrayBuffer()
            screenshotBase64 = Buffer.from(arrayBuffer).toString('base64')
            console.log(`[Firecrawl] Screenshot downloaded, base64 length: ${screenshotBase64.length}`)
          } else {
            console.log(`[Firecrawl] Failed to download screenshot: ${screenshotResponse.status}`)
          }
        } catch (err) {
          console.log(`[Firecrawl] Error downloading screenshot: ${err.message}`)
        }
      } else {
        // Already base64
        screenshotBase64 = doc.screenshot
        console.log(`[Firecrawl] Screenshot already base64, length: ${screenshotBase64.length}`)
      }
    } else {
      console.log(`[Firecrawl] No screenshot in response`)
    }

    console.log(`[Firecrawl] Successfully scraped: ${url}`)
    console.log(`[Firecrawl] rawHtml available: ${!!doc.rawHtml}, length: ${doc.rawHtml?.length || 0}`)

    // Extract heading visibility data from actions result
    let headingVisibility = null
    if (doc.actions && Array.isArray(doc.actions) && doc.actions.length > 0) {
      const visibilityResult = doc.actions[0]
      if (visibilityResult && visibilityResult.result) {
        headingVisibility = visibilityResult.result
        console.log(`[Firecrawl] Heading visibility data:`, {
          total: headingVisibility.length,
          visible: headingVisibility.filter(h => h.visible).length,
          hidden: headingVisibility.filter(h => !h.visible).length,
          hiddenReasons: headingVisibility.filter(h => !h.visible).map(h => `${h.tag}: ${h.reason}`)
        })
      }
    } else {
      console.log(`[Firecrawl] No actions result - executeJavascript may not be supported or failed`)
    }

    return {
      html: doc.html || '',
      rawHtml: doc.rawHtml || doc.html || '',  // rawHtml contains full page with <head>
      markdown: doc.markdown || '',
      screenshot: screenshotBase64,
      links: doc.links || [],
      metadata: doc.metadata || {},
      headingVisibility,  // Browser-detected heading visibility
      success: true
    }
  } catch (error) {
    console.error(`[Firecrawl] Error scraping ${url}:`, error.message)
    console.error(`[Firecrawl] Full error:`, error)
    throw new Error(`Firecrawl error: ${error.message}`)
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

/**
 * Search the web using Firecrawl
 */
export async function searchWithFirecrawl(query, limit = 5) {
  const client = getFirecrawlClient()
  if (!client) {
    throw new Error('Firecrawl client not initialized')
  }

  try {
    console.log(`[Firecrawl] Searching: "${query}" (limit: ${limit})`)

    const result = await client.search(query, {
      limit: Math.min(limit, 10),
      lang: 'de',
      country: 'de'
    })

    console.log(`[Firecrawl] Search results:`, result?.data?.length || 0)

    const data = result?.data || result || []

    return data.map(item => ({
      url: item.url,
      title: item.title || item.metadata?.title || 'Unbekannt',
      snippet: item.description || item.metadata?.description || item.excerpt || ''
    }))
  } catch (error) {
    console.error(`[Firecrawl] Search error:`, error.message)
    throw new Error(`Firecrawl search error: ${error.message}`)
  }
}

/**
 * Fetch and parse sitemap.xml from a domain
 */
export async function fetchSitemap(url) {
  const client = getFirecrawlClient()
  if (!client) {
    throw new Error('Firecrawl client not initialized')
  }

  try {
    // Normalize URL to get sitemap
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`)
    let sitemapUrl = url.endsWith('.xml')
      ? url
      : `${urlObj.protocol}//${urlObj.host}/sitemap.xml`

    console.log(`[Firecrawl] Fetching sitemap: ${sitemapUrl}`)

    const result = await client.scrape(sitemapUrl, {
      formats: ['markdown', 'html'],
      onlyMainContent: false,
    })

    const doc = result?.data || result
    const content = doc?.html || doc?.markdown || ''

    // Parse URLs from sitemap XML
    const urls = []
    const locRegex = /<loc>([^<]+)<\/loc>/gi
    let match

    while ((match = locRegex.exec(content)) !== null) {
      const foundUrl = match[1].trim()
      if (foundUrl.startsWith('http')) {
        urls.push(foundUrl)
      }
    }

    // If no <loc> tags found, try to extract URLs from plain text
    if (urls.length === 0) {
      const urlRegex = /https?:\/\/[^\s<>"]+/gi
      while ((match = urlRegex.exec(content)) !== null) {
        urls.push(match[0])
      }
    }

    console.log(`[Firecrawl] Found ${urls.length} URLs in sitemap`)

    return {
      sitemapUrl,
      urls: [...new Set(urls)], // Remove duplicates
      success: true
    }
  } catch (error) {
    console.error(`[Firecrawl] Sitemap error:`, error.message)
    throw new Error(`Sitemap fetch error: ${error.message}`)
  }
}
