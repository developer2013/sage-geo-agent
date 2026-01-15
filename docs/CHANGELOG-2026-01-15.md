# Sage GEO Agent - Changelog 15. Januar 2026

## Zusammenfassung

Umfangreiche Erweiterung des Sage GEO Agents mit neuen Features, Bug-Fixes und Verbesserungen der Analyse-Genauigkeit.

---

## Neue Features

### 1. Score-Monitoring & Alerts

**Ort:** Header → Glocken-Icon (🔔)

**Funktionen:**
- URLs zur Überwachung hinzufügen
- Automatische Alerts bei Score-Änderungen (> 5 Punkte)
- Alert-Historie mit Trend-Anzeige (↑ Verbesserung / ↓ Verschlechterung)
- Ein/Aus-Toggle für einzelne URLs
- Ungelesene Alerts werden mit Badge angezeigt

**Dateien:**
- `client/src/components/ScoreMonitor.tsx`
- `server/routes/monitor.js`
- `server/services/dbService.js` (neue Tabellen: `monitored_urls`, `score_alerts`)

---

### 2. LLM-Zitations-Wahrscheinlichkeit

**Ort:** Tab "Statistiken" → unterhalb der Content-Statistiken

**Funktionen:**
- Geschätzte Wahrscheinlichkeit für Zitierung durch verschiedene LLMs
- Plattform-spezifische Schätzungen: ChatGPT, Perplexity, Google AI, Claude
- Basierend auf GEO-Score, Statistik-Dichte, Schema-Markup
- Visuelle Progress-Bars für jede Plattform

**Dateien:**
- `client/src/components/CitationProbability.tsx`

**Algorithmus:**
```
Probability = (geoFactor × weight) + (statsFactor × weight) + (schemaFactor × weight)
```

---

### 3. Versions-Historie

**Ort:** Analyse-Ergebnis → "Historie" Button (neben Datum)

**Funktionen:**
- Alle früheren Analysen der gleichen URL anzeigen
- Score-Verlauf über Zeit visualisieren
- Vergleich zwischen Versionen möglich
- Schneller Zugriff auf ältere Analysen

**Dateien:**
- `client/src/components/VersionHistory.tsx`
- `server/routes/history.js` (erweitert)

---

### 4. Globales Lern-System (Feedback)

**Ort:** Bei jeder Empfehlung im "Empfehlungen" Tab

**Funktionen:**
- Feedback-Buttons: 👍 Hilfreich / ✓ Umgesetzt / Nicht relevant
- Anonyme Aggregation aller User-Feedbacks
- Empfehlungen werden nach Effektivität sortiert
- Keine personenbezogenen Daten gespeichert

**Dateien:**
- `client/src/components/FeedbackButtons.tsx`
- `client/src/components/Recommendations.tsx` (integriert FeedbackButtons)
- `server/routes/feedback.js`
- `server/services/learningService.js`
- `server/services/dbService.js` (neue Tabelle: `recommendation_stats`)

**Scoring-Formel:**
```javascript
Score = (helpful + implemented×2 - dismissed×0.5) / total
```

---

### 5. Wettbewerbs-Vergleich

**Ort:** Neben URL-Eingabefeld → "Wettbewerbs-Vergleich" Button

**Funktionen:**
- Mehrere URLs gleichzeitig vergleichen (bis zu 5)
- Score-Vergleich zwischen Seiten
- Identifikation von Stärken/Schwächen im Vergleich
- Export der Vergleichsergebnisse

**Dateien:**
- `client/src/components/CompetitorComparison.tsx`
- `server/routes/chat.js` (Tools: `compare_pages`, `compare_multiple`)

---

### 6. Sage Brand Voice Module

**Ort:** Chat-Panel → unten (Toggle "Sage Brand Voice")

**Funktionen:**
- Optionale Aktivierung des Sage Tone of Voice
- Zielgruppen-Auswahl (Small Business, Mid-Size CFO, HR Leaders, Accountants)
- Content-Generierung folgt Sage-Prinzipien: Human, Simplify, Trust, Bold
- Angepasste Formulierungen und CTAs

**Dateien:**
- `client/src/components/BrandSettings.tsx`
- `server/services/prompts/brandPrompt.js`
- `server/data/sageBrandContext.json`
- `server/routes/brand.js`

---

### 7. Impact-Rating für Empfehlungen

**Ort:** Jede Empfehlung im "Empfehlungen" Tab

**Funktionen:**
- Impact-Level: HOCH / MITTEL / NIEDRIG
- Prozentuale Auswirkung (z.B. "+30-40%")
- Quellenangabe (z.B. "Princeton GEO-BENCH")
- Sterne-Visualisierung (⭐⭐⭐)

**Basiert auf Forschung:**
| Maßnahme | Impact |
|----------|--------|
| Statistiken + Quellen | +30-40% |
| Zitate einbauen | +30-40% |
| Direct Answer | +10-20% |
| Autor + Bio (E-E-A-T) | +5-10% |

---

## Bug-Fixes

### Fix 1: Meta-Tag Extraktion (rawHtml)

**Problem:** Meta-Tags zeigten (0) obwohl sie auf der Seite existieren.

**Ursache:** Firecrawl's `html` Format enthält nur Main-Content ohne `<head>`.

**Lösung:**
- `rawHtml` Format von Firecrawl anfordern
- `rawHtml` für Meta-Tag-Parsing verwenden

**Commit:** `c304280`

**Dateien:**
- `server/services/firecrawlService.js` (Zeile 28: `formats: ['markdown', 'html', 'rawHtml', ...]`)
- `server/services/scraperService.js` (Zeile 131: `htmlForParsing = firecrawlResult.rawHtml || firecrawlResult.html`)

---

### Fix 2: Link-Zählung (mailto/tel)

**Problem:** `mailto:`, `tel:`, `sms:` Links wurden als interne Links gezählt.

**Lösung:**
- Nicht-navigierbare Protokolle überspringen
- Nur `http://` und `https://` Links zählen
- Anchor-only Links (`#section`) ausschließen

**Commit:** `d008a70`

**Datei:** `server/routes/analyze.js` (Zeilen 88-118)

```javascript
// Skip mailto:, tel:, sms:, and other non-http protocols
if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('sms:')) return
// Only count http/https links
if (!['http:', 'https:'].includes(linkUrl.protocol)) return
```

---

### Fix 3: Bild/Link Deduplizierung

**Problem:** Bilder und Links wurden mehrfach gezählt (YouTube-Embeds, Tracking-Pixel, Query-Parameter-Varianten).

**Lösung:**
- `Set()` für unique URLs
- YouTube/Tracking-Domains ausschließen
- URL-Normalisierung (Query-Parameter entfernen)

**Commit:** `5fb0e3a`

**Datei:** `server/routes/analyze.js`

```javascript
const excludedDomains = [
  'youtube.com', 'youtu.be', 'ytimg.com',
  'google-analytics.com', 'googletagmanager.com',
  'facebook.com', 'twitter.com', 'linkedin.com',
  'doubleclick.net', 'googlesyndication.com'
]
```

---

### Fix 4: Chat FOREIGN KEY Error

**Problem:** "FOREIGN KEY constraint failed" beim Chat mit alten/gelöschten Analysen.

**Ursache:** `chat_messages` Tabelle referenziert `analyses` Tabelle.

**Lösung:**
- Prüfen ob Analyse existiert vor dem Speichern
- Graceful Handling wenn Analyse nicht existiert
- Chat funktioniert weiter, nur ohne Persistenz

**Commit:** `ff2b441`

**Dateien:**
- `server/services/dbService.js` (Funktion `saveChatMessage`)
- `server/routes/chat.js` (Error Handling)

---

### Fix 5: Badge forwardRef

**Problem:** React Warning "Function components cannot be given refs" bei Radix UI Tooltips.

**Lösung:** Badge-Komponente mit `React.forwardRef()` wrappen.

**Commit:** `e5e885a`

**Datei:** `client/src/components/ui/badge.tsx`

---

## Datenbank-Erweiterungen

### Neue Tabellen

```sql
-- Score Monitoring
CREATE TABLE monitored_urls (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  name TEXT,
  last_score INTEGER,
  last_checked TEXT,
  alert_threshold INTEGER DEFAULT 5,
  enabled INTEGER DEFAULT 1,
  created_at TEXT
);

CREATE TABLE score_alerts (
  id INTEGER PRIMARY KEY,
  monitored_url_id INTEGER,
  old_score INTEGER,
  new_score INTEGER,
  change INTEGER,
  alert_type TEXT,
  seen INTEGER DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (monitored_url_id) REFERENCES monitored_urls(id)
);

-- Global Learning System
CREATE TABLE recommendation_stats (
  id INTEGER PRIMARY KEY,
  recommendation_type TEXT UNIQUE NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  implemented_count INTEGER DEFAULT 0,
  dismissed_count INTEGER DEFAULT 0,
  total_shown INTEGER DEFAULT 0,
  effectiveness_score REAL DEFAULT 1.0,
  last_updated TEXT
);
```

---

## API-Endpoints (Neu)

### Monitoring
- `GET /api/monitor/urls` - Liste überwachter URLs
- `POST /api/monitor/urls` - URL hinzufügen
- `DELETE /api/monitor/urls/:id` - URL entfernen
- `PATCH /api/monitor/urls/:id/toggle` - URL aktivieren/deaktivieren
- `GET /api/monitor/alerts` - Alert-Liste
- `GET /api/monitor/alerts/unseen` - Ungelesene Alerts zählen
- `POST /api/monitor/alerts/seen` - Alerts als gelesen markieren

### Feedback (Learning System)
- `POST /api/feedback` - Feedback senden
- `GET /api/feedback/stats` - Aggregierte Statistiken

### Brand
- `GET /api/brand/audiences` - Zielgruppen-Liste
- `GET /api/brand/context` - Brand-Kontext für Prompts

---

## Deployment

**Plattform:** Railway
**URL:** https://sage-geo-agent-production.up.railway.app/

**Alle Commits gepusht und deployed:**
```
ff2b441 Fix: Handle missing analysis in chat message saving
d008a70 Fix: Exclude mailto/tel/sms links from link statistics
c304280 Fix: Use rawHtml from Firecrawl for meta tag extraction
5fb0e3a fix: Deduplicate images and links in content statistics
e5e885a fix: Add forwardRef to Badge component for Radix UI compatibility
7f5d89a feat: Add monitoring, citation probability, brand module, version history & learning system
```

---

## Hinweise für Tests

1. **Meta-Tags testen:** Neue Analyse durchführen (alte sind gecacht ohne rawHtml)
2. **Link-Zählung:** Seiten mit mailto:/tel: Links analysieren
3. **Score-Monitoring:** URL im Glocken-Menü hinzufügen
4. **Chat:** Sollte jetzt auch mit alten Analysen funktionieren (ohne FOREIGN KEY Error)
5. **Feedback:** Bei Empfehlungen "Hilfreich" oder "Umgesetzt" klicken

---

## Bekannte Einschränkungen

- Cache: Alte Analysen haben keine rawHtml-basierten Meta-Tags (Lösung: Neu analysieren)
- Learning System: Braucht Zeit um aussagekräftige Daten zu sammeln (min. 10 Feedbacks pro Empfehlungstyp)
- Brand Module: Nur für Content-Generierung im Chat, nicht für Analyse

---

*Erstellt: 15. Januar 2026*
*Version: 2.0.0*
