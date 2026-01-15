# Sage GEO Agent - Erweiterungsplan

> **Erstellt:** 14. Januar 2026
> **Version:** 2.1 (mit Railway PostgreSQL + Volumes)
> **Geschätzter Aufwand:** 24-34 Stunden
> **9 Phasen (inkl. Phase 0: DB Migration), 41 Implementierungsschritte**

---

## Aktueller Stand

Der Agent bietet bereits:
- GEO Score (0-100) mit 5 Kategorien
- 6 Analyse-Tabs (Stärken, Schwächen, Empfehlungen, Stats, Performance, Code)
- Chat mit 6 Tools (fetch_webpage, compare_pages, compare_multiple, search_competitors, generate_schema_markup, analyze_sitemap)
- Content-Stats, CTA-Analyse, Tabellen-Analyse

---

## User Research Insights (aus Sage-Präsentation)

**Kritische Faktoren für Klick-Entscheidungen:**
- Konkrete Preview-Texte > vage Beschreibungen
- B2B-Relevanz und deutscher Markt-Fokus
- Attention-Trigger Keywords: "SME", "AI-supported", "All-in-one", "Integration"
- Technische Details, Video-Demos, externe Ratings als Trust-Signale
- Nutzer suchen "immediate overview of features, usability, support"

**→ Neue Analyse-Dimension:** "SERP Click-Worthiness Score"

---

## FINALER PLAN: 8 Phasen

### FEATURE 0: Pre-Analysis Setup (NEU - Priorität!)

**Ziel:** Nutzer kann vor der Analyse den Fokus wählen → weniger, aber relevanterer Output

#### 0.1 Quick Presets (Buttons)
```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Wähle deinen Analyse-Fokus:                             │
│                                                             │
│  [🚀 Schnell-Scan]  [📊 Voll-Analyse]  [🔍 SERP Focus]     │
│                                                             │
│  ▼ Erweiterte Optionen                                      │
└─────────────────────────────────────────────────────────────┘
```

**Preset-Definitionen:**
| Preset | Aktivierte Module | Dauer |
|--------|-------------------|-------|
| 🚀 Schnell-Scan | GEO Score + Top 3 Issues | ~10s |
| 📊 Voll-Analyse | Alle Module (Standard) | ~30s |
| 🔍 SERP Focus | SERP Preview + Meta-Optimierung | ~15s |

#### 0.2 Erweiterte Optionen (Aufklappbar)
```
▼ Erweiterte Optionen
┌─────────────────────────────────────────────────────────────┐
│  Module auswählen:                                          │
│  ☑️ GEO Score & Citability                                  │
│  ☑️ SERP Preview & Meta-Tags                                │
│  ☑️ Content-Struktur (Headings, Listen)                     │
│  ☐ Schema Markup Analyse                                    │
│  ☐ Performance-Metriken                                     │
│  ☐ AI-Crawler Readiness (robots.txt)                        │
│  ☐ Bild-Analyse (Alt-Tags, Accessibility)                   │
└─────────────────────────────────────────────────────────────┘
```

#### 0.3 State-Management
- Preset-Auswahl setzt automatisch passende Checkboxen
- Manuelle Checkbox-Änderung wechselt zu "Custom" Modus
- Einstellungen werden im LocalStorage gespeichert
- Backend filtert Response basierend auf gewählten Modulen

---

### FEATURE 1: PageSpeed-Style Dashboard

**Ziel:** Visuell ansprechende Übersicht wie Google PageSpeed

#### 1.1 Score-Cards mit Ampel-System
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  GEO Score  │  Content    │  Technical  │  SERP CTR   │
│    🟢 87    │   🟢 91     │   🟡 72     │   🔴 45     │
│   Excellent │    Good     │   Needs     │   Poor      │
│             │             │   Work      │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Ampel-Logik:**
- 🟢 Grün: 80-100 (Excellent)
- 🟡 Gelb: 50-79 (Needs Work)
- 🔴 Rot: 0-49 (Poor)

#### 1.2 Sub-Score Breakdown (Accordion)
Jede Kategorie aufklappbar mit Details:
- Content Quality (35 Punkte möglich)
- Structure & Formatting (25 Punkte)
- Schema & Technical (20 Punkte)
- E-E-A-T & Authority (15 Punkte)
- Actuality (5 Punkte)

#### 1.3 Quick Actions Panel
- "🔧 Fix Critical Issues" → Zeigt alle kritischen Empfehlungen
- "📋 Copy Schema Markup" → Generiert und kopiert JSON-LD
- "📊 Compare with Competitor" → Öffnet Vergleichs-Tool

---

### FEATURE 2: SERP Click-Worthiness Analyse (NEU)

**Basierend auf Sage User Research**

#### 2.1 Neue Metriken
| Metrik | Was wird geprüft |
|--------|------------------|
| **Title Tag Quality** | Länge, Keywords, Handlungsaufforderung |
| **Meta Description** | Konkret vs. vage, Call-to-Action |
| **B2B Signale** | "SME", "Enterprise", "Business" Keywords |
| **Trust Triggers** | Externe Ratings, Zertifikate, Testimonials |
| **Feature Clarity** | Integration, Usability, Support erwähnt? |
| **Video Content** | Video-Demos vorhanden? |

#### 2.2 SERP Preview Card
```
┌────────────────────────────────────────────────────┐
│ 🔍 So erscheint Ihre Seite in Google:              │
├────────────────────────────────────────────────────┤
│ Sage Business Cloud | Buchhaltung für KMU          │
│ https://www.sage.com/de-de/buchhaltung             │
│ Die All-in-One Buchhaltungslösung für kleine und   │
│ mittlere Unternehmen. ✓ AI-supported ✓ Integration │
├────────────────────────────────────────────────────┤
│ ⚠️ Title: 52/60 Zeichen  ✅ Description: 155 chars │
└────────────────────────────────────────────────────┘
```

#### 2.3 Attention-Trigger Analyse
Checkt ob diese Keywords vorhanden sind:
- [ ] "AI-supported" / "KI-gestützt"
- [ ] "All-in-one" / "Komplett-Lösung"
- [ ] "SME" / "KMU" / "Mittelstand"
- [ ] "Integration" / "Schnittstellen"
- [ ] "Kostenlos testen" / "Free Trial"

---

### FEATURE 3: Verbessertes Tab-Layout

#### 3.1 Neue Tab-Struktur
```
[📊 Overview] [✅ Strengths] [⚠️ Issues] [💡 Actions] [🔍 SERP] [🖼️ Bilder] [📈 Stats] [</> Code]
```

**Neuer Tab: "🔍 SERP"** enthält:
- SERP Preview Card
- Click-Worthiness Score
- Attention Triggers Checklist
- Meta-Tag Optimizer

#### 3.2 Diagnostic Mode (PageSpeed-Style)
Unter dem Hauptscore ein aufklappbarer Bereich:
```
▼ Diagnose anzeigen (23 bestandene Prüfungen, 5 Probleme)
  ✅ H1 vorhanden und einzigartig
  ✅ Meta Description vorhanden
  ⚠️ Keine Structured Data gefunden
  ❌ robots.txt blockiert AI-Crawler
  ...
```

---

### FEATURE 4: Bilder-Analyse Tab (NEU) - Echte Vision-Analyse

**Ziel:** Claude sieht und beschreibt jedes einzelne Bild

#### 4.1 Aktueller Stand (bereits implementiert)
- ✅ Firecrawl holt Screenshot + Bilder als base64
- ✅ Claude erhält bis zu 3 Bilder zur Vision-Analyse
- ⚠️ Claude gibt nur Zusammenfassung zurück, keine Pro-Bild-Analyse

#### 4.2 Erweiterung: Pro-Bild-Analyse

**Neues Interface:**
```typescript
interface ImageDetail {
  src: string                    // Bild-URL
  alt: string | null             // Alt-Text (falls vorhanden)
  type: 'png' | 'jpeg' | 'svg' | 'webp' | 'gif'
  dimensions?: { width: number, height: number }
  base64?: string                // Für Thumbnail-Anzeige
  aiDescription?: string         // NEU: Was Claude auf dem Bild sieht
  hasText?: boolean              // NEU: Enthält das Bild Text?
  suggestedAlt?: string          // NEU: Claude's Alt-Text-Vorschlag
}
```

**Claude Prompt-Erweiterung:**
```
Analysiere JEDES Bild einzeln und beschreibe:
1. Was ist auf dem Bild zu sehen? (Personen, Grafiken, Screenshots, Diagramme)
2. Enthält das Bild wichtigen Text? (Ja/Nein + welcher Text)
3. Schlage einen besseren Alt-Text vor

Fülle für jedes Bild:
- aiDescription: "Detaillierte Beschreibung was zu sehen ist"
- hasText: true/false
- suggestedAlt: "Vorgeschlagener Alt-Text für SEO"
```

#### 4.3 UI: Bilder-Tab mit Thumbnails + Erkenntnisse
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🖼️ Bilder-Analyse (5 Bilder analysiert)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐  hero-banner.png                                          │
│  │ 📷       │  Alt: "Sage Business Cloud Dashboard"                     │
│  │ Thumbnail│  ────────────────────────────────────────                │
│  │          │  🤖 Claude sieht: "Ein Dashboard mit Umsatzdiagramm,      │
│  └──────────┘  3 KPI-Karten und einem Navigationsmenü links."          │
│                ⚠️ Enthält Text: "Q3 Revenue: €2.4M"                     │
│                💡 Vorschlag: "Sage Dashboard zeigt Q3 Umsatz von €2.4M" │
│                                                                         │
│  ┌──────────┐  pricing-table.png                                        │
│  │ 📷       │  Alt: ❌ FEHLT                                            │
│  │ Thumbnail│  ────────────────────────────────────────                │
│  │          │  🤖 Claude sieht: "Preistabelle mit 3 Paketen:            │
│  └──────────┘  Starter €29, Business €79, Enterprise auf Anfrage"      │
│                ⚠️ Enthält Text: Ja (Preise und Paket-Namen)            │
│                💡 Vorschlag: "Preisvergleich: Starter €29, Business €79"│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 4.4 Chat-Integration (verbessert)
Der Chat-Agent kann jetzt:
- **Spezifische Bilder referenzieren:** "Das Hero-Banner zeigt..."
- **Alt-Text-Vorschläge nutzen:** "Verwende diesen Alt-Text: ..."
- **Bild-Inhalte diskutieren:** "Der Preis auf dem Bild ist €29"
- **Accessibility-Probleme erklären:** "Dieses Bild hat wichtigen Text ohne Alt-Tag"

**Kontext wird erweitert:** `imageDetails[]` Array mit allen analysierten Bildern

---

## Implementierungsschritte

### Phase 1: Pre-Analysis Setup (Priorität!)
1. [ ] `AnalysisConfig.tsx`: Neue Komponente mit Presets + Checkboxen
2. [ ] `UrlInput.tsx`: Integration des Setup-Panels
3. [ ] `types.ts`: Interface `AnalysisConfig` für Modul-Auswahl
4. [ ] `App.tsx`: State für config, LocalStorage-Persistenz

### Phase 2: Modulare Prompt-Architektur (Kernänderung!)

**Neue Dateistruktur:**
```
server/services/
├── aiService.js          → Orchestrator (ruft Module parallel auf)
├── prompts/
│   ├── coreGeoPrompt.js  → GEO Score + Stärken/Schwächen (~150 Zeilen)
│   ├── visionPrompt.js   → Bilder sehen + beschreiben (~80 Zeilen)
│   ├── serpPrompt.js     → Title/Meta optimieren (~60 Zeilen)
│   └── technicalPrompt.js → Schema/robots.txt (~50 Zeilen)
```

**Implementierungsschritte:**
5. [ ] `prompts/coreGeoPrompt.js`: Core GEO-Analyse extrahieren
6. [ ] `prompts/visionPrompt.js`: Pro-Bild-Analyse mit Vision
7. [ ] `prompts/serpPrompt.js`: SERP Preview + Attention Triggers
8. [ ] `prompts/technicalPrompt.js`: Schema + robots.txt Check
9. [ ] `aiService.js`: Orchestrator mit `Promise.all()` für parallele Ausführung
10. [ ] `analyze.js`: Config-Parameter akzeptieren, nur gewählte Module aufrufen

### Phase 3: Dashboard UI
11. [ ] `ScoreCardsGrid.tsx`: 4 Score-Cards mit Ampel-System
12. [ ] `SerpPreviewCard.tsx`: Google SERP Vorschau
13. [ ] `DiagnosticsList.tsx`: Expandierbarer Diagnose-Bereich

### Phase 4: Bilder Vision UI
14. [ ] `types.ts`: `ImageDetail` Interface mit aiDescription, hasText, suggestedAlt
15. [ ] `ImageAnalysisTab.tsx`: Thumbnails + Claude-Beschreibungen anzeigen

### Phase 5: Integration & Polish
16. [ ] `AnalysisResult.tsx`: SERP-Tab + Bilder-Tab + konditionelle Anzeige
17. [ ] Chat-Context erweitern mit imageDetails[]
18. [ ] Responsive Design für alle neuen Komponenten
19. [ ] Styling mit bestehendem Neumorphism-Design
20. [ ] Loading States für parallele Module (zeigt welches Modul gerade läuft)

---

## ZUSÄTZLICHE FEATURES (Phase 6-8)

### Phase 6: Score Trends & History

**Ziel:** Score-Entwicklung über Zeit visualisieren

#### 6.1 Datenbank-Erweiterung
- Speichere jeden Scan mit Timestamp
- Gruppiere nach URL (mehrere Scans pro URL)
- Berechne Delta zum vorherigen Scan

#### 6.2 Trend-Visualisierung
```
┌─────────────────────────────────────────────────────────────┐
│  📈 Score-Verlauf für sage.com/buchhaltung                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  100│                              ●                        │
│   80│              ●───────●──────╱                        │
│   60│    ●────────╱                                        │
│   40│                                                       │
│     └──────────────────────────────────────────────────────│
│       Jan    Feb    Mär    Apr    Mai                      │
│                                                             │
│  ↑ +12 Punkte seit letztem Monat                           │
└─────────────────────────────────────────────────────────────┘
```

#### 6.3 Delta-Report
```
┌─────────────────────────────────────────────────────────────┐
│  🔄 Änderungen seit letztem Scan (vor 7 Tagen)              │
├─────────────────────────────────────────────────────────────┤
│  ✅ NEU: Schema Markup hinzugefügt (+8 Punkte)              │
│  ✅ NEU: H2s als Fragen formuliert (+7 Punkte)              │
│  ⚠️ VERSCHLECHTERT: Meta Description gekürzt (-3 Punkte)   │
│  ────────────────────────────────────────────────────────── │
│  Netto: +12 Punkte (72 → 84)                                │
└─────────────────────────────────────────────────────────────┘
```

**Implementierung:**
21. [ ] `server/routes/history.js`: Gruppierung nach URL, Delta-Berechnung
22. [ ] `client/src/components/ScoreTrendChart.tsx`: Recharts Line-Chart
23. [ ] `client/src/components/DeltaReport.tsx`: Änderungs-Liste
24. [ ] `types.ts`: `HistoryTrend`, `DeltaItem` Interfaces

---

### Phase 7: PDF Export

**Ziel:** Professionelle Reports zum Teilen/Archivieren

#### 7.1 Report-Inhalt
```
┌─────────────────────────────────────────────────────────────┐
│  📄 GEO Analyse Report                                      │
│  ══════════════════════════════════════════════════════════ │
│                                                             │
│  URL: sage.com/buchhaltung                                  │
│  Datum: 14. Januar 2026                                     │
│  GEO Score: 84/100 🟢                                       │
│                                                             │
│  ══════════════════════════════════════════════════════════ │
│  ZUSAMMENFASSUNG                                            │
│  ──────────────────────────────────────────────────────────│
│  • 5 Stärken identifiziert                                  │
│  • 3 kritische Probleme                                     │
│  • 8 Empfehlungen                                           │
│                                                             │
│  ══════════════════════════════════════════════════════════ │
│  DETAILANALYSE                                              │
│  ──────────────────────────────────────────────────────────│
│  [Score-Cards] [Stärken] [Schwächen] [Empfehlungen]        │
│  [SERP Preview] [Bilder-Analyse] [Code-Beispiele]          │
│                                                             │
│  ══════════════════════════════════════════════════════════ │
│  Generiert mit Sage GEO Agent | Powered by Claude Opus 4.5 │
└─────────────────────────────────────────────────────────────┘
```

**Implementierung:**
25. [ ] `server/routes/export.js`: PDF-Generation mit `puppeteer` oder `@react-pdf/renderer`
26. [ ] `client/src/components/PdfReportTemplate.tsx`: Report-Layout
27. [ ] `ExportButton.tsx`: PDF-Download Button (existiert, erweitern)

---

### Phase 8: Content-Generator (AI-Powered)

**Ziel:** Claude schreibt verbesserte Texte automatisch

#### 8.1 Neue Chat-Tools

| Tool | Was es macht |
|------|--------------|
| `generate_title` | Optimierten Title Tag generieren |
| `generate_meta_description` | SEO-optimierte Meta Description |
| `generate_h2_questions` | H2-Überschriften als Fragen |
| `generate_tldr` | TL;DR Zusammenfassung |
| `generate_faq` | FAQ-Sektion aus Content |
| `improve_paragraph` | Paragraph mit Statistiken anreichern |

#### 8.2 Quick Actions im UI
```
┌─────────────────────────────────────────────────────────────┐
│  ✨ Content verbessern                                      │
├─────────────────────────────────────────────────────────────┤
│  [📝 Title optimieren]  [📋 Meta Description]               │
│  [❓ H2s als Fragen]    [📊 TL;DR generieren]              │
│  [💬 FAQ erstellen]     [📈 Mit Statistiken anreichern]    │
└─────────────────────────────────────────────────────────────┘
```

#### 8.3 Output-Format
```
┌─────────────────────────────────────────────────────────────┐
│  📝 Optimierter Title Tag                                   │
├─────────────────────────────────────────────────────────────┤
│  ALT:  "Buchhaltung - Sage"                                 │
│  NEU:  "Buchhaltung für KMU | All-in-One Software | Sage"   │
│                                                             │
│  ✅ Länge: 52/60 Zeichen                                    │
│  ✅ Keywords: KMU, All-in-One, Software                     │
│  ✅ Brand am Ende                                           │
│                                                             │
│  [📋 Kopieren]  [💬 Im Chat besprechen]                     │
└─────────────────────────────────────────────────────────────┘
```

**Implementierung:**
28. [ ] `server/routes/chat.js`: 6 neue Tools für Content-Generation
29. [ ] `prompts/contentGeneratorPrompt.js`: Spezialisierter Prompt
30. [ ] `client/src/components/ContentGenerator.tsx`: Quick Actions UI
31. [ ] `client/src/components/GeneratedContentCard.tsx`: Output-Anzeige

---

## Kritische Dateien

### Frontend
| Datei | Änderung |
|-------|----------|
| `client/src/components/AnalysisConfig.tsx` | **NEU**: Preset-Buttons + Checkboxen |
| `client/src/components/UrlInput.tsx` | Setup-Panel integrieren |
| `client/src/App.tsx` | Config State + LocalStorage |
| `client/src/types.ts` | `AnalysisConfig` + `ImageDetail` + `ModuleResult` Interfaces |
| `client/src/components/ScoreCardsGrid.tsx` | **NEU**: Dashboard mit Ampel |
| `client/src/components/SerpPreviewCard.tsx` | **NEU**: SERP Vorschau |
| `client/src/components/ImageAnalysisTab.tsx` | **NEU**: Bilder-Tab mit Thumbnails |
| `client/src/components/AnalysisResult.tsx` | Neue Tabs + konditionelle Anzeige |

### Backend (Modulare Prompts)
| Datei | Änderung |
|-------|----------|
| `server/services/prompts/coreGeoPrompt.js` | **NEU**: GEO Score Modul |
| `server/services/prompts/visionPrompt.js` | **NEU**: Pro-Bild Vision Modul |
| `server/services/prompts/serpPrompt.js` | **NEU**: SERP/Meta Modul |
| `server/services/prompts/technicalPrompt.js` | **NEU**: Schema/robots Modul |
| `server/services/aiService.js` | **REFACTOR**: Orchestrator mit Promise.all() |
| `server/routes/analyze.js` | Config-Parameter verarbeiten |

---

## Verifikation

### 1. Pre-Analysis Setup
- [ ] Presets wählen → Checkboxen werden automatisch gesetzt
- [ ] Checkboxen manuell ändern → wechselt zu "Custom"
- [ ] LocalStorage speichert Einstellungen

### 2. Modulare Prompts (Parallel)
- [ ] Schnell-Scan: Nur Core GEO läuft → ~10s
- [ ] Voll-Analyse: Alle 4 Module parallel → ~15s
- [ ] Progress zeigt: "GEO ✓ | Vision ⏳ | SERP ✓ | Technical ✓"

### 3. Score-Cards
- [ ] Ampel-Farben korrekt (🟢>80, 🟡50-79, 🔴<50)
- [ ] Jede Card zeigt Modul-Score

### 4. Bilder Vision
- [ ] Pro-Bild-Beschreibung: "Claude sieht: ..."
- [ ] Thumbnails werden angezeigt
- [ ] Alt-Text-Vorschläge pro Bild

### 5. Chat-Integration
- [ ] "Was ist auf dem Hero-Banner?" → Detaillierte Antwort
- [ ] ImageDetails[] im Chat-Kontext verfügbar

### 6. Responsive
- [ ] Mobile: Setup-Panel stapelt vertikal
- [ ] Desktop: Score-Cards in 4er-Grid

---

## CODE-BEISPIELE

### AnalysisConfig Interface (types.ts)
```typescript
export interface AnalysisConfig {
  preset: 'quick' | 'full' | 'serp' | 'custom'
  modules: {
    coreGeo: boolean      // Immer aktiv
    vision: boolean       // Bilder analysieren
    serp: boolean         // SERP/Meta
    technical: boolean    // Schema/robots
  }
}

export interface ImageDetail {
  src: string
  alt: string | null
  type: 'png' | 'jpeg' | 'svg' | 'webp' | 'gif'
  dimensions?: { width: number; height: number }
  base64?: string
  aiDescription?: string      // Was Claude sieht
  hasText?: boolean           // Text im Bild?
  suggestedAlt?: string       // Vorgeschlagener Alt-Text
}

export interface ModuleResult {
  module: 'coreGeo' | 'vision' | 'serp' | 'technical'
  status: 'pending' | 'running' | 'completed' | 'error'
  duration?: number           // ms
  result?: any
}

export interface HistoryTrend {
  url: string
  scans: {
    id: string
    date: string
    geoScore: number
  }[]
  delta: DeltaItem[]
}

export interface DeltaItem {
  type: 'improved' | 'degraded' | 'new' | 'removed'
  category: string
  description: string
  points: number
}
```

### Orchestrator (aiService.js)
```javascript
export async function analyzeWithModules(url, pageCode, config) {
  const modules = []

  // Core GEO immer aktiv
  modules.push(runModule('coreGeo', coreGeoPrompt, url, pageCode))

  // Optionale Module basierend auf Config
  if (config.modules.vision && pageCode.images?.length > 0) {
    modules.push(runModule('vision', visionPrompt, url, pageCode))
  }

  if (config.modules.serp) {
    modules.push(runModule('serp', serpPrompt, url, pageCode))
  }

  if (config.modules.technical) {
    modules.push(runModule('technical', technicalPrompt, url, pageCode))
  }

  // Parallel ausführen
  const results = await Promise.all(modules)

  // Ergebnisse zusammenführen
  return mergeResults(results)
}

async function runModule(name, promptFn, url, pageCode) {
  const startTime = Date.now()
  try {
    const result = await promptFn(url, pageCode)
    return {
      module: name,
      status: 'completed',
      duration: Date.now() - startTime,
      result
    }
  } catch (error) {
    return {
      module: name,
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message
    }
  }
}
```

### Vision Prompt (prompts/visionPrompt.js)
```javascript
export async function visionPrompt(url, pageCode) {
  const images = pageCode.images?.slice(0, 5) || []

  const messageContent = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64
    }
  }))

  messageContent.push({
    type: 'text',
    text: `Analysiere diese ${images.length} Bilder von der Webseite ${url}.

Für JEDES Bild gib zurück:
{
  "images": [
    {
      "index": 0,
      "aiDescription": "Detaillierte Beschreibung was zu sehen ist",
      "hasText": true/false,
      "textContent": "Erkannter Text falls vorhanden",
      "suggestedAlt": "Optimierter Alt-Text für SEO",
      "issues": ["Liste von Problemen"]
    }
  ]
}

Beschreibe genau WAS du siehst - Personen, Diagramme, Text, UI-Elemente.`
  })

  const response = await client.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    messages: [{ role: 'user', content: messageContent }]
  })

  return JSON.parse(response.content[0].text)
}
```

### ScoreCardsGrid.tsx
```tsx
import { Card, CardContent } from './ui/card'

interface ScoreCardProps {
  title: string
  score: number
  maxScore: number
}

function ScoreCard({ title, score, maxScore }: ScoreCardProps) {
  const percentage = (score / maxScore) * 100
  const status = percentage >= 80 ? 'excellent' : percentage >= 50 ? 'needs-work' : 'poor'
  const colors = {
    excellent: 'bg-emerald-500',
    'needs-work': 'bg-amber-500',
    poor: 'bg-red-500'
  }

  return (
    <Card className="neu-card">
      <CardContent className="p-4 text-center">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`text-3xl font-bold ${colors[status]} bg-clip-text text-transparent`}>
          {score}
        </div>
        <div className="text-xs text-muted-foreground">
          {status === 'excellent' && '🟢 Excellent'}
          {status === 'needs-work' && '🟡 Needs Work'}
          {status === 'poor' && '🔴 Poor'}
        </div>
      </CardContent>
    </Card>
  )
}

export function ScoreCardsGrid({ result }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <ScoreCard title="GEO Score" score={result.geoScore} maxScore={100} />
      <ScoreCard title="Content" score={result.contentScore} maxScore={35} />
      <ScoreCard title="Technical" score={result.technicalScore} maxScore={20} />
      <ScoreCard title="SERP CTR" score={result.serpScore} maxScore={100} />
    </div>
  )
}
```

### Content Generator Tools (chat.js)
```javascript
const contentGeneratorTools = [
  {
    name: 'generate_title',
    description: 'Generiert einen optimierten Title Tag basierend auf der Analyse',
    input_schema: {
      type: 'object',
      properties: {
        current_title: { type: 'string', description: 'Aktueller Title' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Wichtige Keywords' },
        brand: { type: 'string', description: 'Markenname' }
      },
      required: ['current_title']
    }
  },
  {
    name: 'generate_meta_description',
    description: 'Generiert eine SEO-optimierte Meta Description',
    input_schema: {
      type: 'object',
      properties: {
        current_description: { type: 'string' },
        page_content_summary: { type: 'string' },
        target_keywords: { type: 'array', items: { type: 'string' } }
      },
      required: ['page_content_summary']
    }
  },
  {
    name: 'generate_h2_questions',
    description: 'Wandelt H2-Überschriften in Frage-Format um',
    input_schema: {
      type: 'object',
      properties: {
        current_h2s: { type: 'array', items: { type: 'string' } }
      },
      required: ['current_h2s']
    }
  },
  {
    name: 'generate_tldr',
    description: 'Erstellt eine TL;DR Zusammenfassung für den Seitenanfang',
    input_schema: {
      type: 'object',
      properties: {
        page_content: { type: 'string' },
        max_words: { type: 'number', default: 50 }
      },
      required: ['page_content']
    }
  },
  {
    name: 'generate_faq',
    description: 'Erstellt FAQ-Sektion aus dem Content',
    input_schema: {
      type: 'object',
      properties: {
        page_content: { type: 'string' },
        num_questions: { type: 'number', default: 5 }
      },
      required: ['page_content']
    }
  },
  {
    name: 'improve_paragraph',
    description: 'Reichert einen Absatz mit Statistiken und Quellen an',
    input_schema: {
      type: 'object',
      properties: {
        paragraph: { type: 'string' },
        topic: { type: 'string' }
      },
      required: ['paragraph', 'topic']
    }
  }
]
```

---

## ABHÄNGIGKEITEN

### Neue NPM Packages
```json
{
  "dependencies": {
    "recharts": "^2.12.0",          // Für Score-Trend-Charts
    "@react-pdf/renderer": "^3.4.0", // Für PDF Export
    "date-fns": "^3.3.0"             // Für Datum-Formatierung
  }
}
```

### Bestehende Packages (bereits installiert)
- `@anthropic-ai/sdk` - Claude API
- `@mendable/firecrawl-js` - Web Scraping
- `@radix-ui/*` - UI Komponenten
- `tailwindcss` - Styling

---

## GESCHÄTZTE AUFWÄNDE

| Phase | Feature | Geschätzter Aufwand |
|-------|---------|---------------------|
| 1 | Pre-Analysis Setup | 2-3 Stunden |
| 2 | Modulare Prompts | 4-6 Stunden |
| 3 | Dashboard UI | 3-4 Stunden |
| 4 | Bilder Vision UI | 2-3 Stunden |
| 5 | Integration | 2-3 Stunden |
| 6 | Score Trends | 3-4 Stunden |
| 7 | PDF Export | 2-3 Stunden |
| 8 | Content Generator | 3-4 Stunden |
| **Total** | | **21-30 Stunden** |

---

## EMPFOHLENE REIHENFOLGE

**⚠️ WICHTIG: Phase 0 ist Voraussetzung für Phase 6 + 7!**

0. **Phase 0** - Railway PostgreSQL + Volumes (VORAUSSETZUNG für persistente Daten)
1. **Phase 1 + 2** - Grundlegende Architektur (Pre-Analysis + Modulare Prompts)
2. **Phase 3 + 4** - UI-Verbesserungen (Dashboard + Bilder Vision)
3. **Phase 5** - Integration testen
4. **Phase 6** - History & Trends (benötigt Phase 0!)
5. **Phase 7** - PDF Export (benötigt Phase 0!)
6. **Phase 8** - Content Generator (Bonus)

---

## HINWEISE FÜR SPÄTERE AUSFÜHRUNG

1. **Backup erstellen** vor Änderungen
2. **Branch erstellen**: `git checkout -b feature/geo-agent-v2`
3. **Server stoppen** vor großen Änderungen
4. **Schrittweise testen** - nach jeder Phase
5. **Commit nach jeder Phase** - nicht alles auf einmal

---

## QUICK START

```bash
# 1. Branch erstellen
git checkout -b feature/geo-agent-v2

# 2. Dependencies installieren
cd client && npm install recharts @react-pdf/renderer date-fns

# 3. Server starten
cd .. && npm run dev

# 4. Mit Phase 0 oder Phase 1 beginnen
# → Phase 0 wenn History/PDF benötigt
# → Phase 1 wenn nur UI-Features
```

---

## PHASE 0: RAILWAY DATENBANK-MIGRATION (VORAUSSETZUNG)

### Warum notwendig?
- Railway hat **ephemere Dateisysteme** - SQLite-Daten gehen bei Redeployments verloren!
- Für History (Phase 6) und PDF Export (Phase 7) ist persistenter Storage erforderlich

### Gewählte Lösung: Railway PostgreSQL + Volumes

| Komponente | Zweck | Kosten |
|------------|-------|--------|
| **Railway PostgreSQL** | History, Analysen, Chat-Verlauf | ~$5/Monat |
| **Railway Volumes** | PDF-Dateien speichern | $0.25/GB |

---

### 0.1 Neue Dependencies

```bash
# In server/ Verzeichnis
npm install pg multer
npm uninstall better-sqlite3  # Nach erfolgreicher Migration
```

**package.json Änderungen:**
```json
{
  "dependencies": {
    "pg": "^8.11.3",           // PostgreSQL Client
    "multer": "^1.4.5-lts.1"   // PDF Upload Handling
  }
}
```

---

### 0.2 PostgreSQL Schema

```sql
-- Analyses Tabelle (erweitert um pdf_path)
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    geo_score INTEGER NOT NULL,
    score_summary TEXT,
    strengths JSONB,          -- Native JSON in PostgreSQL
    weaknesses JSONB,
    recommendations JSONB,
    next_step TEXT,
    page_code JSONB,
    pdf_path TEXT,            -- NEU: Pfad zur PDF-Datei
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_analyses_analyzed_at ON analyses(analyzed_at DESC);
CREATE INDEX idx_analyses_url ON analyses(url);

-- Chat Messages Tabelle
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_analysis_id ON chat_messages(analysis_id);
```

---

### 0.3 Kritische Code-Änderungen

**SQLite → PostgreSQL Unterschiede:**

| SQLite (aktuell) | PostgreSQL (neu) |
|------------------|------------------|
| `better-sqlite3` (sync) | `pg` (async/await) |
| `datetime('now')` | `NOW()` |
| `AUTOINCREMENT` | `SERIAL` |
| `TEXT` für JSON | `JSONB` (nativ) |

**Neue dbService.js Struktur:**
```javascript
import pg from 'pg'
const { Pool } = pg

let pool = null

export async function initDatabase() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } : false,
  })
  // Schema erstellen...
}

// Alle Funktionen werden async!
export async function saveAnalysis(analysis) { ... }
export async function getAnalyses(limit = 50) { ... }
export async function getAnalysisById(id) { ... }
```

---

### 0.4 PDF Storage Service (NEU)

**Datei:** `server/services/pdfService.js`
```javascript
import fs from 'fs'
import path from 'path'

// Railway Volume oder lokaler Fallback
const PDF_STORAGE_PATH = process.env.PDF_STORAGE_PATH || './data/pdfs'

export function savePdf(analysisId, pdfBuffer) {
  const filepath = path.join(PDF_STORAGE_PATH, `${analysisId}.pdf`)
  fs.writeFileSync(filepath, pdfBuffer)
  return filepath
}

export function getPdfPath(analysisId) { ... }
export function deletePdf(analysisId) { ... }
export function streamPdf(analysisId) { ... }
```

---

### 0.5 Railway Konfiguration

**1. PostgreSQL Add-on erstellen:**
```
Railway Dashboard > Projekt > New Service > PostgreSQL
```

**2. Volume erstellen:**
```
Railway Dashboard > Service > Volumes > Add Volume
Name: pdf-storage
Mount Path: /data/pdfs
```

**3. Environment Variables:**
```env
# Automatisch von Railway PostgreSQL:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Manuell setzen:
NODE_ENV=production
PDF_STORAGE_PATH=/data/pdfs
ANTHROPIC_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=fc-...
```

---

### 0.6 Migrations-Script

**Datei:** `server/scripts/migrate-to-postgres.js`

Migriert bestehende SQLite-Daten zu PostgreSQL:
```bash
node server/scripts/migrate-to-postgres.js
```

---

### 0.7 Implementierungsschritte Phase 0

| # | Aufgabe | Datei |
|---|---------|-------|
| 0.1 | PostgreSQL Service auf Railway erstellen | Dashboard |
| 0.2 | Volume für PDFs erstellen | Dashboard |
| 0.3 | Environment Variables setzen | Dashboard |
| 0.4 | `pg` und `multer` installieren | package.json |
| 0.5 | dbService.js auf async umschreiben | server/services/dbService.js |
| 0.6 | Route-Handler auf async/await umstellen | server/routes/*.js |
| 0.7 | pdfService.js erstellen | server/services/pdfService.js |
| 0.8 | PDF-Route erstellen | server/routes/pdf.js |
| 0.9 | Migration durchführen | scripts/migrate-to-postgres.js |
| 0.10 | Testen & Deployen | - |

---

### 0.8 Verifikation Phase 0

- [ ] PostgreSQL verbunden (Health-Check: `/api/health`)
- [ ] Alte Daten migriert (Analysen + Chat-Verlauf)
- [ ] Neue Analysen werden in PostgreSQL gespeichert
- [ ] PDFs können hochgeladen werden (`POST /api/pdf/:id`)
- [ ] PDFs können heruntergeladen werden (`GET /api/pdf/:id`)
- [ ] Volume-Daten überleben Redeployment

---

> **Hinweis:** Dieser Plan wurde mit Claude Opus 4.5 erstellt und kann mit dem gleichen Modell ausgeführt werden. Für beste Ergebnisse: Teile dem Assistenten mit "Führe Phase X aus" und gib ihm dieses Dokument als Kontext.
