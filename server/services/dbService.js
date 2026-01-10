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
  const stmt = db.prepare(`
    INSERT INTO chat_messages (analysis_id, role, content)
    VALUES (?, ?, ?)
  `)
  stmt.run(analysisId, role, content)
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
