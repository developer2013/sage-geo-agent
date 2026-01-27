import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../db/analyses.db')
let db

export function initDatabase() {
  db = new Database(dbPath)

  db.prepare(`
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      geo_score INTEGER NOT NULL,
      score_summary TEXT,
      strengths TEXT,
      weaknesses TEXT,
      recommendations TEXT,
      next_step TEXT,
      page_code TEXT,
      analyzed_at TEXT DEFAULT (datetime('now'))
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at
    ON analyses(analyzed_at DESC)
  `).run()

  // Chat messages table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_analysis_id
    ON chat_messages(analysis_id)
  `).run()

  // Recommendation stats table for global learning system
  db.prepare(`
    CREATE TABLE IF NOT EXISTS recommendation_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_type TEXT UNIQUE NOT NULL,
      helpful_count INTEGER DEFAULT 0,
      implemented_count INTEGER DEFAULT 0,
      dismissed_count INTEGER DEFAULT 0,
      total_shown INTEGER DEFAULT 0,
      effectiveness_score REAL DEFAULT 1.0,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_stats_type
    ON recommendation_stats(recommendation_type)
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_recommendation_stats_score
    ON recommendation_stats(effectiveness_score DESC)
  `).run()

  // Monitored URLs table for Score Alerts
  db.prepare(`
    CREATE TABLE IF NOT EXISTS monitored_urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      name TEXT,
      last_score INTEGER,
      last_checked TEXT,
      alert_threshold INTEGER DEFAULT 5,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_monitored_urls_enabled
    ON monitored_urls(enabled)
  `).run()

  // Score alerts/notifications table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS score_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitored_url_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      old_score INTEGER NOT NULL,
      new_score INTEGER NOT NULL,
      change INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      seen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (monitored_url_id) REFERENCES monitored_urls(id) ON DELETE CASCADE
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_score_alerts_seen
    ON score_alerts(seen, created_at DESC)
  `).run()

  // GEO References table for tracking external sources
  db.prepare(`
    CREATE TABLE IF NOT EXISTS geo_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      last_checked TEXT,
      last_content_hash TEXT,
      check_interval_hours INTEGER DEFAULT 24,
      enabled INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_geo_references_category
    ON geo_references(category)
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_geo_references_enabled
    ON geo_references(enabled, last_checked)
  `).run()

  // GEO Reference alerts table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS geo_reference_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      title TEXT,
      description TEXT,
      old_hash TEXT,
      new_hash TEXT,
      seen INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reference_id) REFERENCES geo_references(id) ON DELETE CASCADE
    )
  `).run()

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_geo_reference_alerts_seen
    ON geo_reference_alerts(seen, created_at DESC)
  `).run()

  console.log('Database initialized')
  return db
}

export function getDb() {
  if (!db) {
    initDatabase()
  }
  return db
}

export function saveAnalysis(analysis) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO analyses (id, url, geo_score, score_summary, strengths, weaknesses, recommendations, next_step, page_code, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    analysis.id,
    analysis.url,
    analysis.geoScore,
    analysis.scoreSummary,
    JSON.stringify(analysis.strengths),
    JSON.stringify(analysis.weaknesses),
    JSON.stringify(analysis.recommendations),
    analysis.nextStep,
    JSON.stringify(analysis.pageCode),
    analysis.analyzedAt
  )

  return analysis
}

export function getAnalyses(limit = 50) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT id, url, geo_score as geoScore, analyzed_at as analyzedAt
    FROM analyses
    ORDER BY analyzed_at DESC
    LIMIT ?
  `)

  return stmt.all(limit)
}

export function getAnalysisById(id) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT * FROM analyses WHERE id = ?
  `)

  const row = stmt.get(id)
  if (!row) return null

  return {
    id: row.id,
    url: row.url,
    geoScore: row.geo_score,
    scoreSummary: row.score_summary,
    strengths: JSON.parse(row.strengths),
    weaknesses: JSON.parse(row.weaknesses),
    recommendations: JSON.parse(row.recommendations),
    nextStep: row.next_step,
    pageCode: JSON.parse(row.page_code),
    analyzedAt: row.analyzed_at
  }
}

export function deleteAnalysis(id) {
  const db = getDb()
  // Delete chat messages first (cascade doesn't always work with SQLite)
  db.prepare('DELETE FROM chat_messages WHERE analysis_id = ?').run(id)
  const stmt = db.prepare('DELETE FROM analyses WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Chat message functions
export function saveChatMessage(analysisId, role, content) {
  const db = getDb()

  // Check if analysis exists first (to avoid FOREIGN KEY constraint error)
  const analysisExists = db.prepare('SELECT 1 FROM analyses WHERE id = ?').get(analysisId)
  if (!analysisExists) {
    console.log(`[DB] Cannot save chat message - analysis ${analysisId} not found`)
    return false
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO chat_messages (analysis_id, role, content)
      VALUES (?, ?, ?)
    `)
    stmt.run(analysisId, role, content)
    return true
  } catch (error) {
    console.error(`[DB] Error saving chat message:`, error.message)
    return false
  }
}

export function getChatMessages(analysisId) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT role, content, created_at as createdAt
    FROM chat_messages
    WHERE analysis_id = ?
    ORDER BY id ASC
  `)
  return stmt.all(analysisId)
}

export function deleteChatMessages(analysisId) {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM chat_messages WHERE analysis_id = ?')
  const result = stmt.run(analysisId)
  return result.changes > 0
}

// Check for recent analysis of the same URL (within hours)
export function getRecentAnalysisByUrl(url, hoursAgo = 24) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT * FROM analyses
    WHERE url = ?
    AND datetime(analyzed_at) > datetime('now', '-' || ? || ' hours')
    ORDER BY analyzed_at DESC
    LIMIT 1
  `)

  const row = stmt.get(url, hoursAgo)
  if (!row) return null

  return {
    id: row.id,
    url: row.url,
    geoScore: row.geo_score,
    scoreSummary: row.score_summary,
    strengths: JSON.parse(row.strengths),
    weaknesses: JSON.parse(row.weaknesses),
    recommendations: JSON.parse(row.recommendations),
    nextStep: row.next_step,
    pageCode: JSON.parse(row.page_code),
    analyzedAt: row.analyzed_at,
    cached: true
  }
}

// ==========================================
// URL HISTORY - All analyses for a specific URL
// ==========================================

/**
 * Get all analyses for a specific URL (for version history)
 * @param {string} url - The URL to get history for
 * @param {number} limit - Max number of versions to return
 * @returns {Array} List of analyses sorted by date (newest first)
 */
export function getUrlHistory(url, limit = 20) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      id,
      url,
      geo_score as geoScore,
      score_summary as scoreSummary,
      strengths,
      weaknesses,
      recommendations,
      analyzed_at as analyzedAt
    FROM analyses
    WHERE url = ?
    ORDER BY analyzed_at DESC
    LIMIT ?
  `)

  const rows = stmt.all(url, limit)

  return rows.map((row, index) => ({
    id: row.id,
    url: row.url,
    geoScore: row.geoScore,
    scoreSummary: row.scoreSummary,
    strengths: JSON.parse(row.strengths),
    weaknesses: JSON.parse(row.weaknesses),
    recommendations: JSON.parse(row.recommendations),
    analyzedAt: row.analyzedAt,
    version: rows.length - index // V1, V2, V3...
  }))
}

/**
 * Compare two analyses and return the differences
 * @param {string} oldId - ID of the older analysis
 * @param {string} newId - ID of the newer analysis
 * @returns {Object} Comparison result
 */
export function compareAnalyses(oldId, newId) {
  const oldAnalysis = getAnalysisById(oldId)
  const newAnalysis = getAnalysisById(newId)

  if (!oldAnalysis || !newAnalysis) {
    return null
  }

  // Score difference
  const scoreDiff = newAnalysis.geoScore - oldAnalysis.geoScore

  // Find new strengths (in new but not in old)
  const oldStrengthTitles = new Set(oldAnalysis.strengths?.map(s => s.title.toLowerCase()) || [])
  const newStrengths = newAnalysis.strengths?.filter(
    s => !oldStrengthTitles.has(s.title.toLowerCase())
  ) || []

  // Find removed strengths (in old but not in new)
  const newStrengthTitles = new Set(newAnalysis.strengths?.map(s => s.title.toLowerCase()) || [])
  const removedStrengths = oldAnalysis.strengths?.filter(
    s => !newStrengthTitles.has(s.title.toLowerCase())
  ) || []

  // Find fixed weaknesses (in old but not in new)
  const newWeaknessTitles = new Set(newAnalysis.weaknesses?.map(w => w.title.toLowerCase()) || [])
  const fixedWeaknesses = oldAnalysis.weaknesses?.filter(
    w => !newWeaknessTitles.has(w.title.toLowerCase())
  ) || []

  // Find new weaknesses (in new but not in old)
  const oldWeaknessTitles = new Set(oldAnalysis.weaknesses?.map(w => w.title.toLowerCase()) || [])
  const newWeaknesses = newAnalysis.weaknesses?.filter(
    w => !oldWeaknessTitles.has(w.title.toLowerCase())
  ) || []

  return {
    oldAnalysis: {
      id: oldAnalysis.id,
      geoScore: oldAnalysis.geoScore,
      analyzedAt: oldAnalysis.analyzedAt,
      strengthCount: oldAnalysis.strengths?.length || 0,
      weaknessCount: oldAnalysis.weaknesses?.length || 0
    },
    newAnalysis: {
      id: newAnalysis.id,
      geoScore: newAnalysis.geoScore,
      analyzedAt: newAnalysis.analyzedAt,
      strengthCount: newAnalysis.strengths?.length || 0,
      weaknessCount: newAnalysis.weaknesses?.length || 0
    },
    changes: {
      scoreDiff,
      scoreImproved: scoreDiff > 0,
      newStrengths,
      removedStrengths,
      fixedWeaknesses,
      newWeaknesses,
      summary: scoreDiff > 0
        ? `Score verbessert um ${scoreDiff} Punkte`
        : scoreDiff < 0
          ? `Score verschlechtert um ${Math.abs(scoreDiff)} Punkte`
          : 'Score unverändert'
    }
  }
}

// ==========================================
// GLOBAL LEARNING SYSTEM - Recommendation Stats
// ==========================================

/**
 * Record feedback for a recommendation type (anonymous, aggregated only)
 * @param {string} recommendationType - Type identifier (e.g., "add_statistics", "improve_headings")
 * @param {'helpful' | 'implemented' | 'dismissed'} action - User action
 */
export function recordRecommendationFeedback(recommendationType, action) {
  const db = getDb()

  // Validate action
  if (!['helpful', 'implemented', 'dismissed'].includes(action)) {
    throw new Error(`Invalid action: ${action}`)
  }

  // Upsert: Insert or update the stats
  const stmt = db.prepare(`
    INSERT INTO recommendation_stats (recommendation_type, ${action}_count, total_shown, last_updated)
    VALUES (?, 1, 1, datetime('now'))
    ON CONFLICT(recommendation_type) DO UPDATE SET
      ${action}_count = ${action}_count + 1,
      last_updated = datetime('now')
  `)

  stmt.run(recommendationType)

  // Recalculate effectiveness score
  recalculateEffectivenessScore(recommendationType)
}

/**
 * Increment the "shown" counter when a recommendation is displayed
 * @param {string} recommendationType - Type identifier
 */
export function incrementRecommendationShown(recommendationType) {
  const db = getDb()

  const stmt = db.prepare(`
    INSERT INTO recommendation_stats (recommendation_type, total_shown, last_updated)
    VALUES (?, 1, datetime('now'))
    ON CONFLICT(recommendation_type) DO UPDATE SET
      total_shown = total_shown + 1,
      last_updated = datetime('now')
  `)

  stmt.run(recommendationType)
}

/**
 * Recalculate effectiveness score using Simple Weighted Scoring
 * Formula: Score = (helpful + implemented×2 - dismissed×0.5) / total
 * @param {string} recommendationType - Type identifier
 */
function recalculateEffectivenessScore(recommendationType) {
  const db = getDb()

  const row = db.prepare(`
    SELECT helpful_count, implemented_count, dismissed_count, total_shown
    FROM recommendation_stats
    WHERE recommendation_type = ?
  `).get(recommendationType)

  if (!row || row.total_shown < 10) {
    // Not enough data, keep default score
    return
  }

  // Simple Weighted Scoring Algorithm
  const rawScore = (
    row.helpful_count +
    row.implemented_count * 2 -
    row.dismissed_count * 0.5
  ) / row.total_shown

  // Normalize to 0.1 - 2.0 range
  const normalizedScore = Math.max(0.1, Math.min(2.0, 1.0 + rawScore))

  db.prepare(`
    UPDATE recommendation_stats
    SET effectiveness_score = ?
    WHERE recommendation_type = ?
  `).run(normalizedScore, recommendationType)
}

/**
 * Get all recommendation stats ordered by effectiveness
 * @returns {Array} Stats for all recommendation types
 */
export function getRecommendationStats() {
  const db = getDb()

  const stmt = db.prepare(`
    SELECT
      recommendation_type as recommendationType,
      helpful_count as helpfulCount,
      implemented_count as implementedCount,
      dismissed_count as dismissedCount,
      total_shown as totalShown,
      effectiveness_score as effectivenessScore,
      last_updated as lastUpdated
    FROM recommendation_stats
    ORDER BY effectiveness_score DESC
  `)

  return stmt.all()
}

/**
 * Get effectiveness score for a specific recommendation type
 * @param {string} recommendationType - Type identifier
 * @returns {number} Effectiveness score (default 1.0)
 */
export function getRecommendationEffectiveness(recommendationType) {
  const db = getDb()

  const row = db.prepare(`
    SELECT effectiveness_score
    FROM recommendation_stats
    WHERE recommendation_type = ?
  `).get(recommendationType)

  return row?.effectiveness_score ?? 1.0
}

// ==========================================
// SCORE MONITORING & ALERTS
// ==========================================

/**
 * Add a URL to monitoring
 * @param {string} url - URL to monitor
 * @param {string} name - Optional display name
 * @param {number} alertThreshold - Score change threshold for alerts (default 5)
 */
export function addMonitoredUrl(url, name = null, alertThreshold = 5) {
  const db = getDb()

  // Check if already exists
  const existing = db.prepare('SELECT id FROM monitored_urls WHERE url = ?').get(url)
  if (existing) {
    return { success: false, error: 'URL wird bereits überwacht' }
  }

  // Get latest score from analyses if available
  const latestAnalysis = db.prepare(`
    SELECT geo_score FROM analyses WHERE url = ? ORDER BY analyzed_at DESC LIMIT 1
  `).get(url)

  const stmt = db.prepare(`
    INSERT INTO monitored_urls (url, name, last_score, alert_threshold, last_checked)
    VALUES (?, ?, ?, ?, datetime('now'))
  `)

  const result = stmt.run(url, name, latestAnalysis?.geo_score || null, alertThreshold)
  return { success: true, id: result.lastInsertRowid }
}

/**
 * Remove a URL from monitoring
 * @param {number} id - Monitored URL ID
 */
export function removeMonitoredUrl(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM monitored_urls WHERE id = ?').run(id)
  return result.changes > 0
}

/**
 * Get all monitored URLs
 */
export function getMonitoredUrls() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      id,
      url,
      name,
      last_score as lastScore,
      last_checked as lastChecked,
      alert_threshold as alertThreshold,
      enabled,
      created_at as createdAt
    FROM monitored_urls
    ORDER BY created_at DESC
  `)
  return stmt.all()
}

/**
 * Update monitored URL after a new analysis
 * @param {string} url - URL that was analyzed
 * @param {number} newScore - New GEO score
 */
export function updateMonitoredUrlScore(url, newScore) {
  const db = getDb()

  const monitored = db.prepare(`
    SELECT id, last_score, alert_threshold FROM monitored_urls WHERE url = ? AND enabled = 1
  `).get(url)

  if (!monitored) return null

  const oldScore = monitored.last_score
  const change = oldScore !== null ? newScore - oldScore : 0

  // Update the monitored URL
  db.prepare(`
    UPDATE monitored_urls
    SET last_score = ?, last_checked = datetime('now')
    WHERE id = ?
  `).run(newScore, monitored.id)

  // Create alert if threshold exceeded
  if (oldScore !== null && Math.abs(change) >= monitored.alert_threshold) {
    const alertType = change > 0 ? 'improvement' : 'decline'

    db.prepare(`
      INSERT INTO score_alerts (monitored_url_id, url, old_score, new_score, change, alert_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(monitored.id, url, oldScore, newScore, change, alertType)

    return { alerted: true, change, alertType }
  }

  return { alerted: false, change }
}

/**
 * Get unseen alerts
 */
export function getUnseenAlerts() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      sa.id,
      sa.url,
      mu.name,
      sa.old_score as oldScore,
      sa.new_score as newScore,
      sa.change,
      sa.alert_type as alertType,
      sa.created_at as createdAt
    FROM score_alerts sa
    JOIN monitored_urls mu ON sa.monitored_url_id = mu.id
    WHERE sa.seen = 0
    ORDER BY sa.created_at DESC
  `)
  return stmt.all()
}

/**
 * Get all alerts (for history)
 * @param {number} limit - Max alerts to return
 */
export function getAlertHistory(limit = 50) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      sa.id,
      sa.url,
      mu.name,
      sa.old_score as oldScore,
      sa.new_score as newScore,
      sa.change,
      sa.alert_type as alertType,
      sa.seen,
      sa.created_at as createdAt
    FROM score_alerts sa
    JOIN monitored_urls mu ON sa.monitored_url_id = mu.id
    ORDER BY sa.created_at DESC
    LIMIT ?
  `)
  return stmt.all(limit)
}

/**
 * Mark alerts as seen
 * @param {number[]} ids - Alert IDs to mark as seen
 */
export function markAlertsSeen(ids) {
  const db = getDb()
  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(`UPDATE score_alerts SET seen = 1 WHERE id IN (${placeholders})`)
  return stmt.run(...ids)
}

/**
 * Toggle monitoring for a URL
 * @param {number} id - Monitored URL ID
 * @param {boolean} enabled - Enable or disable
 */
export function toggleMonitoredUrl(id, enabled) {
  const db = getDb()
  const stmt = db.prepare('UPDATE monitored_urls SET enabled = ? WHERE id = ?')
  return stmt.run(enabled ? 1 : 0, id)
}

// ==========================================
// GEO REFERENCES - External Source Tracking
// ==========================================

/**
 * Add a GEO reference source
 * @param {Object} reference - Reference data
 * @param {string} reference.url - URL to track
 * @param {string} reference.name - Display name
 * @param {string} reference.category - Category: 'research', 'news', 'competitor', 'tool'
 * @param {string} [reference.description] - Optional description
 * @param {number} [reference.checkIntervalHours] - Check interval in hours (default 24)
 * @param {string} [reference.notes] - Optional notes
 */
export function addGeoReference({ url, name, category, description = null, checkIntervalHours = 24, notes = null }) {
  const db = getDb()

  // Validate category
  const validCategories = ['research', 'news', 'competitor', 'tool']
  if (!validCategories.includes(category)) {
    return { success: false, error: `Ungueltige Kategorie: ${category}. Erlaubt: ${validCategories.join(', ')}` }
  }

  // Check if already exists
  const existing = db.prepare('SELECT id FROM geo_references WHERE url = ?').get(url)
  if (existing) {
    return { success: false, error: 'URL ist bereits als GEO-Referenz gespeichert' }
  }

  const stmt = db.prepare(`
    INSERT INTO geo_references (url, name, category, description, check_interval_hours, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(url, name, category, description, checkIntervalHours, notes)
  return { success: true, id: result.lastInsertRowid }
}

/**
 * Get all GEO references, optionally filtered by category
 * @param {string} [category] - Optional category filter
 */
export function getGeoReferences(category = null) {
  const db = getDb()

  let stmt
  if (category) {
    stmt = db.prepare(`
      SELECT
        id,
        url,
        name,
        category,
        description,
        last_checked as lastChecked,
        last_content_hash as lastContentHash,
        check_interval_hours as checkIntervalHours,
        enabled,
        notes,
        created_at as createdAt
      FROM geo_references
      WHERE category = ?
      ORDER BY name ASC
    `)
    return stmt.all(category)
  }

  stmt = db.prepare(`
    SELECT
      id,
      url,
      name,
      category,
      description,
      last_checked as lastChecked,
      last_content_hash as lastContentHash,
      check_interval_hours as checkIntervalHours,
      enabled,
      notes,
      created_at as createdAt
    FROM geo_references
    ORDER BY category, name ASC
  `)
  return stmt.all()
}

/**
 * Get GEO references that need checking
 * @returns {Array} References where last_checked is null or older than check_interval_hours
 */
export function getGeoReferencesToCheck() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      id,
      url,
      name,
      category,
      last_content_hash as lastContentHash,
      check_interval_hours as checkIntervalHours
    FROM geo_references
    WHERE enabled = 1
    AND (
      last_checked IS NULL
      OR datetime(last_checked, '+' || check_interval_hours || ' hours') < datetime('now')
    )
    ORDER BY last_checked ASC NULLS FIRST
  `)
  return stmt.all()
}

/**
 * Update GEO reference after checking
 * @param {number} id - Reference ID
 * @param {string} contentHash - Hash of content for change detection
 */
export function updateGeoReferenceCheck(id, contentHash) {
  const db = getDb()
  const stmt = db.prepare(`
    UPDATE geo_references
    SET last_checked = datetime('now'), last_content_hash = ?
    WHERE id = ?
  `)
  return stmt.run(contentHash, id)
}

/**
 * Remove a GEO reference
 * @param {number} id - Reference ID
 */
export function removeGeoReference(id) {
  const db = getDb()
  const result = db.prepare('DELETE FROM geo_references WHERE id = ?').run(id)
  return result.changes > 0
}

/**
 * Toggle GEO reference enabled state
 * @param {number} id - Reference ID
 * @param {boolean} enabled - Enable or disable
 */
export function toggleGeoReference(id, enabled) {
  const db = getDb()
  const stmt = db.prepare('UPDATE geo_references SET enabled = ? WHERE id = ?')
  return stmt.run(enabled ? 1 : 0, id)
}

/**
 * Create a GEO reference alert (content changed)
 * @param {number} referenceId - Reference ID
 * @param {string} alertType - Alert type: 'content_changed', 'new_content', 'error'
 * @param {string} title - Alert title
 * @param {string} description - Alert description
 * @param {string} [oldHash] - Previous content hash
 * @param {string} [newHash] - New content hash
 */
export function createGeoReferenceAlert(referenceId, alertType, title, description, oldHash = null, newHash = null) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO geo_reference_alerts (reference_id, alert_type, title, description, old_hash, new_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(referenceId, alertType, title, description, oldHash, newHash)
}

/**
 * Get unseen GEO reference alerts
 */
export function getUnseenGeoReferenceAlerts() {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      a.id,
      a.alert_type as alertType,
      a.title,
      a.description,
      a.created_at as createdAt,
      r.url,
      r.name,
      r.category
    FROM geo_reference_alerts a
    JOIN geo_references r ON a.reference_id = r.id
    WHERE a.seen = 0
    ORDER BY a.created_at DESC
  `)
  return stmt.all()
}

/**
 * Get all GEO reference alerts (for history)
 * @param {number} limit - Max alerts to return
 */
export function getGeoReferenceAlertHistory(limit = 50) {
  const db = getDb()
  const stmt = db.prepare(`
    SELECT
      a.id,
      a.alert_type as alertType,
      a.title,
      a.description,
      a.seen,
      a.created_at as createdAt,
      r.url,
      r.name,
      r.category
    FROM geo_reference_alerts a
    JOIN geo_references r ON a.reference_id = r.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `)
  return stmt.all(limit)
}

/**
 * Mark GEO reference alerts as seen
 * @param {number[]} ids - Alert IDs to mark as seen
 */
export function markGeoReferenceAlertsSeen(ids) {
  const db = getDb()
  const placeholders = ids.map(() => '?').join(',')
  const stmt = db.prepare(`UPDATE geo_reference_alerts SET seen = 1 WHERE id IN (${placeholders})`)
  return stmt.run(...ids)
}
