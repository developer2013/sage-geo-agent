/**
 * Debug Logger Utility for API Monitoring
 *
 * Provides consistent, structured logging for all API calls.
 * - DEBUG=true: Shows all logs (requests, responses, timings)
 * - DEBUG=false: Only shows errors (always active)
 *
 * Log format uses visual indicators:
 * - ▶ Request start
 * - ✅ Success
 * - ⚠️ Warning
 * - ❌ Error
 */

const DEBUG = process.env.DEBUG === 'true'

/**
 * Format file size in human-readable format
 */
function formatSize(bytes) {
  if (bytes === 0) return '0B'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * Format duration in seconds
 */
function formatDuration(ms) {
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Create a timer for measuring operation duration
 */
export function startTimer() {
  return Date.now()
}

/**
 * Get elapsed time from timer start
 */
export function getElapsed(startTime) {
  return Date.now() - startTime
}

/**
 * Log request start
 * @param {string} prefix - Service prefix (e.g., 'Firecrawl', 'Claude', 'Scraper')
 * @param {string} action - Action being performed (e.g., 'SCRAPE', 'ANALYZE', 'FETCH')
 * @param {string} target - Target URL or identifier
 * @param {Object} details - Optional details to log
 */
export function logRequest(prefix, action, target, details = null) {
  if (!DEBUG) return

  console.log(`[${prefix}] ▶ ${action} ${target}`)

  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`)
    })
  }
}

/**
 * Log successful response
 * @param {string} prefix - Service prefix
 * @param {number} duration - Duration in milliseconds
 * @param {Object} details - Response details
 */
export function logSuccess(prefix, duration, details = {}) {
  if (!DEBUG) return

  const detailStr = Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')

  console.log(`[${prefix}] ✅ OK (${formatDuration(duration)}) | ${detailStr}`)
}

/**
 * Log detailed success with multiple lines
 * @param {string} prefix - Service prefix
 * @param {number} duration - Duration in milliseconds
 * @param {Object} details - Response details (each key becomes a line)
 */
export function logSuccessDetailed(prefix, duration, details = {}) {
  if (!DEBUG) return

  console.log(`[${prefix}] ✅ RESPONSE (${formatDuration(duration)})`)
  Object.entries(details).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`)
  })
}

/**
 * Log warning
 * @param {string} prefix - Service prefix
 * @param {string} message - Warning message
 */
export function logWarning(prefix, message) {
  // Warnings are shown in DEBUG mode only
  if (!DEBUG) return
  console.log(`[${prefix}] ⚠️ ${message}`)
}

/**
 * Log error (ALWAYS shown, even without DEBUG=true)
 * @param {string} prefix - Service prefix
 * @param {string|Error} error - Error message or Error object
 * @param {Object} context - Optional context for debugging
 */
export function logError(prefix, error, context = null) {
  const message = error instanceof Error ? error.message : error
  console.error(`[${prefix}] ❌ FEHLER: ${message}`)

  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      console.error(`  - ${key}: ${value}`)
    })
  }

  // In debug mode, show full stack trace
  if (DEBUG && error instanceof Error && error.stack) {
    console.error(`[${prefix}] Stack:`, error.stack)
  }
}

/**
 * Log analysis summary block
 * @param {string} url - Analyzed URL
 * @param {Object} results - Analysis results from all services
 */
export function logSummary(url, results) {
  // Summary is always shown (important for production debugging)
  const truncatedUrl = url.length > 50 ? url.substring(0, 47) + '...' : url

  console.log('')
  console.log('═══════════════════════════════════════')
  console.log(`ANALYSE-STATUS: ${truncatedUrl}`)
  console.log('═══════════════════════════════════════')

  // Firecrawl status
  if (results.firecrawl) {
    const fc = results.firecrawl
    const status = fc.success ? '✅ OK' : '❌ FEHLER'
    const duration = fc.duration ? ` (${formatDuration(fc.duration)})` : ''
    console.log(`Firecrawl:  ${status}${duration}`)

    if (fc.success) {
      console.log(`  - HTML:       ${fc.htmlSize ? formatSize(fc.htmlSize) : 'n/a'} ${fc.htmlSize ? '✓' : '✗'}`)
      console.log(`  - Screenshot: ${fc.hasScreenshot ? '✓' : '✗'}`)
      console.log(`  - Actions:    ${fc.actionsSupported ? '✓' : '✗ (nicht unterstützt)'}`)
    } else if (fc.error) {
      console.log(`  - Fehler: ${fc.error}`)
    }
  } else {
    console.log(`Firecrawl:  ⚠️ nicht verwendet`)
  }

  // Claude API status
  if (results.claude) {
    const cl = results.claude
    const status = cl.success ? '✅ OK' : '❌ FEHLER'
    const duration = cl.duration ? ` (${formatDuration(cl.duration)})` : ''
    console.log(`Claude API: ${status}${duration}`)

    if (cl.success) {
      console.log(`  - Tokens:     ${cl.inputTokens?.toLocaleString() || '?'} → ${cl.outputTokens?.toLocaleString() || '?'}`)
      console.log(`  - Parse:      ${cl.parseSuccess ? '✓' : '✗'}`)
      if (cl.score !== undefined) {
        console.log(`  - Score:      ${cl.score}/100`)
      }
    } else if (cl.error) {
      console.log(`  - Fehler: ${cl.error}`)
    }
  }

  // robots.txt status
  if (results.robotsTxt !== undefined) {
    const status = results.robotsTxt ? '✅ OK' : '⚠️ nicht gefunden'
    console.log(`robots.txt: ${status}`)
  }

  // Schema status
  if (results.schemaCount !== undefined) {
    const status = results.schemaCount > 0 ? '✅' : '⚠️'
    console.log(`Schema:     ${status} ${results.schemaCount} gefunden`)
  }

  console.log('═══════════════════════════════════════')
  console.log('')
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled() {
  return DEBUG
}

/**
 * Helper to format bytes for logging
 */
export { formatSize, formatDuration }
