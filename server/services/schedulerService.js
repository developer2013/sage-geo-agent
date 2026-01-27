/**
 * Scheduler Service for GEO Agent
 * Handles periodic checks of GEO references and monitored URLs
 */

import crypto from 'crypto'
import {
  getGeoReferencesToCheck,
  updateGeoReferenceCheck,
  createGeoReferenceAlert,
  getMonitoredUrls
} from './dbService.js'

// Scheduler state
let isRunning = false
let checkInterval = null
const DEFAULT_CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Generate a hash of content for change detection
 * @param {string} content - Content to hash
 * @returns {string} MD5 hash
 */
function hashContent(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Fetch content from a URL and return basic info
 * @param {string} url - URL to fetch
 * @returns {Object} { success, content, hash, error }
 */
async function fetchAndHash(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 30000
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const content = await response.text()
    const hash = hashContent(content)

    return { success: true, content, hash }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Check a single GEO reference for changes
 * @param {Object} reference - Reference object from database
 * @returns {Object} Check result
 */
async function checkGeoReference(reference) {
  console.log(`[Scheduler] Checking GEO reference: ${reference.name} (${reference.url})`)

  const result = await fetchAndHash(reference.url)

  if (!result.success) {
    console.log(`[Scheduler] Error fetching ${reference.url}: ${result.error}`)
    createGeoReferenceAlert(
      reference.id,
      'error',
      `Fehler beim Abrufen: ${reference.name}`,
      `Die URL ${reference.url} konnte nicht abgerufen werden: ${result.error}`,
      reference.lastContentHash,
      null
    )
    return { checked: true, error: result.error }
  }

  // Check if content changed
  const hasChanged = reference.lastContentHash && reference.lastContentHash !== result.hash
  const isFirstCheck = !reference.lastContentHash

  // Update the reference
  updateGeoReferenceCheck(reference.id, result.hash)

  if (hasChanged) {
    console.log(`[Scheduler] Content changed for: ${reference.name}`)
    createGeoReferenceAlert(
      reference.id,
      'content_changed',
      `Inhalt geaendert: ${reference.name}`,
      `Die GEO-Referenz "${reference.name}" (${reference.category}) hat sich geaendert. Pruefe die URL auf neue Informationen.`,
      reference.lastContentHash,
      result.hash
    )
    return { checked: true, changed: true }
  }

  if (isFirstCheck) {
    console.log(`[Scheduler] First check completed for: ${reference.name}`)
    return { checked: true, firstCheck: true }
  }

  console.log(`[Scheduler] No changes for: ${reference.name}`)
  return { checked: true, changed: false }
}

/**
 * Run a check cycle for all due GEO references
 * @returns {Object} Summary of check results
 */
export async function runGeoReferenceChecks() {
  const references = getGeoReferencesToCheck()

  if (references.length === 0) {
    console.log('[Scheduler] No GEO references due for checking')
    return { checked: 0, changed: 0, errors: 0 }
  }

  console.log(`[Scheduler] Checking ${references.length} GEO references...`)

  const results = {
    checked: 0,
    changed: 0,
    errors: 0,
    firstChecks: 0
  }

  for (const ref of references) {
    const result = await checkGeoReference(ref)

    if (result.checked) results.checked++
    if (result.changed) results.changed++
    if (result.error) results.errors++
    if (result.firstCheck) results.firstChecks++

    // Small delay between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`[Scheduler] Check cycle complete: ${results.checked} checked, ${results.changed} changed, ${results.errors} errors`)
  return results
}

/**
 * Start the scheduler
 * @param {number} [intervalMs] - Check interval in milliseconds (default 1 hour)
 */
export function startScheduler(intervalMs = DEFAULT_CHECK_INTERVAL_MS) {
  if (isRunning) {
    console.log('[Scheduler] Already running')
    return
  }

  console.log(`[Scheduler] Starting with interval ${intervalMs / 1000 / 60} minutes`)
  isRunning = true

  // Run initial check after a short delay
  setTimeout(async () => {
    if (isRunning) {
      await runGeoReferenceChecks()
    }
  }, 10000) // 10 second delay on startup

  // Schedule periodic checks
  checkInterval = setInterval(async () => {
    if (isRunning) {
      await runGeoReferenceChecks()
    }
  }, intervalMs)
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (!isRunning) {
    console.log('[Scheduler] Not running')
    return
  }

  console.log('[Scheduler] Stopping')
  isRunning = false

  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

/**
 * Get scheduler status
 * @returns {Object} Status information
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    checkIntervalMs: checkInterval ? DEFAULT_CHECK_INTERVAL_MS : null
  }
}

/**
 * Manually trigger a check for all GEO references (ignores timing)
 * @returns {Object} Summary of check results
 */
export async function triggerManualCheck() {
  console.log('[Scheduler] Manual check triggered')
  return runGeoReferenceChecks()
}

/**
 * Get predefined GEO reference sources (for easy setup)
 * @returns {Array} List of recommended GEO references
 */
export function getRecommendedGeoReferences() {
  return [
    // Research
    {
      name: 'Princeton GEO Study',
      url: 'https://arxiv.org/abs/2311.09735',
      category: 'research',
      description: 'Original GEO research paper from Princeton',
      checkIntervalHours: 168 // Weekly
    },
    {
      name: 'Google Search Central Blog',
      url: 'https://developers.google.com/search/blog',
      category: 'news',
      description: 'Official Google Search updates',
      checkIntervalHours: 24
    },
    // News
    {
      name: 'Search Engine Land',
      url: 'https://searchengineland.com/',
      category: 'news',
      description: 'SEO and Search Marketing News',
      checkIntervalHours: 12
    },
    {
      name: 'Moz Blog',
      url: 'https://moz.com/blog',
      category: 'news',
      description: 'SEO insights and updates',
      checkIntervalHours: 24
    },
    {
      name: 'Ahrefs Blog',
      url: 'https://ahrefs.com/blog/',
      category: 'news',
      description: 'SEO research and case studies',
      checkIntervalHours: 24
    },
    // Tools
    {
      name: 'OpenAI GPT Changelog',
      url: 'https://platform.openai.com/docs/changelog',
      category: 'tool',
      description: 'GPT model updates and changes',
      checkIntervalHours: 24
    },
    {
      name: 'Perplexity AI',
      url: 'https://www.perplexity.ai/',
      category: 'tool',
      description: 'AI search engine for monitoring',
      checkIntervalHours: 48
    }
  ]
}

export default {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  runGeoReferenceChecks,
  triggerManualCheck,
  getRecommendedGeoReferences
}
