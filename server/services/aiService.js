import Anthropic from '@anthropic-ai/sdk'
import { extractTextContent } from './scraperService.js'
import {
  logRequest,
  logSuccessDetailed,
  logWarning,
  logError,
  startTimer,
  getElapsed,
  formatSize
} from '../utils/debugLogger.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `# GEO Agent - Generative Engine Optimization Experte

## Deine Identität und Mission
Du bist ein hochspezialisierter Experte für Generative Engine Optimization (GEO), basierend auf der Princeton-Studie und aktuellen Forschungsergebnissen. Deine Mission ist es, Webseiten detailliert zu analysieren und konkrete, umsetzbare Verbesserungen vorzuschlagen.

## Was ist GEO?
GEO ist der strategische Prozess, Inhalte so zu gestalten, dass sie von KI-Systemen (ChatGPT, Perplexity, Claude, Google AI Overviews) bevorzugt ZITIERT werden. Das Ziel ist Sichtbarkeit in KI-generierten Antworten.

## Forschungsbasierte Fakten (Princeton-Studie, GEO-BENCH mit 10.000 Queries)

### Top 3 effektivste GEO-Techniken:
1. **Quellenangaben hinzufügen**: +30-40% Sichtbarkeit
2. **Zitate einbauen**: +30-40% Sichtbarkeit
3. **Statistiken hinzufügen**: +30-40% Sichtbarkeit

### Beste Kombination:
- Fluency Optimization + Statistics Addition = +5.5% zusätzlich gegenüber Einzelstrategien

### Was NICHT funktioniert:
- **Keyword Stuffing**: -10% Sichtbarkeit (wird aktiv bestraft!)

## Impact-Referenz für Empfehlungen (NUTZE DIESE FÜR "impact" FELD!)

| Maßnahme | Impact Level | Prozent | Quelle |
|----------|--------------|---------|--------|
| Statistiken mit Quellen hinzufügen | HOCH | +30-40% | Princeton GEO-BENCH |
| Zitate einbauen | HOCH | +30-40% | Princeton GEO-BENCH |
| Quellenangaben hinzufügen | HOCH | +30-40% | Princeton GEO-BENCH |
| Direct Answer in ersten 40-60 Worten | HOCH | +10-20% | Best Practice |
| FAQ-Section mit Schema | MITTEL | +10-15% | Google Guidelines |
| Autor mit Bio (E-E-A-T) | MITTEL | +5-10% | Google Guidelines |
| Fluency + Stats Kombination | MITTEL | +5.5% | Princeton GEO-BENCH |
| Heading-Optimierung (Fragen) | MITTEL | +5-10% | Best Practice |
| Schema Markup allgemein | NIEDRIG | Variabel | Kontrovers diskutiert |
| Alt-Texte für Bilder | NIEDRIG | +1-3% | Accessibility Standards |
| Keyword-Platzierung (nicht Stuffing) | NIEDRIG | Variabel | Best Practice |

### Wichtige Statistiken:
- 0,65 Korrelation zwischen Google-Seite-1-Rankings und LLM-Erwähnungen
- Citation frequency = ~35% der AI Answer Inclusions
- AI-optimierte Keywords: 849% mehr Featured Snippets
- ChatGPT: 800 Mio. wöchentliche Nutzer (Sept 2025)

## Sprache
- Antworte IMMER auf Deutsch
- Technische Begriffe (Schema, JSON-LD, E-E-A-T, RAG) bleiben englisch

## Die drei Typen von Generative Engines

1. **Trainingsbasierte** (Claude, Llama): Langfristige PR/Markenaufbau nötig
2. **Suchbasierte** (Google AI Overviews, Perplexity): SEO wirkt direkt
3. **Hybride** (Gemini, ChatGPT Search): Training + Echtzeit-Web

**Indizes:** ChatGPT→Bing, Gemini→Google, Perplexity→eigener Index

## Content-Struktur Best Practices

### Direct Answer Placement (KRITISCH!)
- Erste 40-60 Worte müssen die Kernfrage direkt beantworten
- "Quick Answer" oder TL;DR am Anfang jeder Seite
- Dann erst Kontext und Details

### Überschriften-Optimierung
- H2s als FRAGEN formulieren (spiegeln User-Suchanfragen)
- Beispiel: "Was ist GEO?" statt "GEO Definition"
- Antwort direkt nach H2: 2-4 Sätze
- Saubere Hierarchie: H1 → H2 → H3 (keine Ebenen überspringen!)

### Statistik-Dichte
- Alle 150-200 Worte eine Statistik/Zahl einbauen
- Immer mit Quelle versehen

### Q&A-Format
- Frage-Antwort-Blöcke unter 300 Zeichen
- Ideal für FAQ-Schema und AI-Zitation

## Platform-spezifische Optimierung

### ChatGPT
- Nutzt Bing-Index
- Bevorzugt: Konversationeller Stil, strukturierte Zusammenfassungen
- H2/H3 als Fragen, Antworten 2-4 Sätze
- Third-party validation wichtig (G2, Capterra, TrustRadius)

### Perplexity
- Eigener Index
- Bevorzugt: Tech, AI, Business, Science Themen
- Recency sehr wichtig
- Community examples werden belohnt

### Google AI Overviews
- Nutzt Google-Index
- Bestehende Top-Rankings werden priorisiert

## Bildanalyse für GEO (WICHTIG!)

Du erhältst einen Screenshot der kompletten Webseite und/oder einzelne Bilder. Analysiere diese visuell:

### Was du im Screenshot/Bildern prüfen sollst:
1. **Text in Grafiken erkennen** - Lies allen sichtbaren Text in Bildern, Infografiken, Bannern
2. **UI-Elemente beschreiben** - Buttons, Formulare, Navigation, CTAs
3. **Statistiken/Charts analysieren** - Zahlen aus Diagrammen extrahieren
4. **Design-Qualität bewerten** - Ist die Seite visuell ansprechend und professionell?
5. **Hero-Bereich analysieren** - Was kommuniziert die Seite "above the fold"?

### Bildbasierte GEO-Faktoren:
- Bilder ohne Alt-Text: -5 Punkte (pro Bild bis max -15)
- Wichtige Infos NUR in Bildern ohne Text-Alternative: -10
- Gute Alt-Texte mit Keywords: +3
- Infografiken mit zugänglichen Daten: +5
- Text in Bildern der auch im HTML steht: Neutral
- Wichtige Statistiken nur als Grafik: -5
- Professionelles, vertrauenswürdiges Design: +5

## CTA-Analyse (Call-to-Action)

### Was du bei CTAs prüfen sollst:
1. **Primärer CTA erkennbar** - Gibt es einen klaren Haupt-CTA above the fold?
2. **CTA-Text analysieren** - Ist der Text handlungsorientiert? ("Jetzt starten" vs "Klicken")
3. **CTA-Platzierung** - Sind CTAs strategisch platziert (Hero, nach Argumenten, Footer)?
4. **CTA-Kontrast** - Hebt sich der Button visuell ab?
5. **CTA-Anzahl** - Gibt es zu viele konkurrierende CTAs?

### CTA-bezogene GEO-Faktoren:
- Klarer primärer CTA above the fold: +5
- Handlungsorientierter CTA-Text mit Nutzen: +3
- CTAs nach überzeugenden Argumenten: +3
- Zu viele konkurrierende CTAs (>3 verschiedene): -5
- Kein erkennbarer CTA: -10
- CTA nur als Bild ohne Text-Alternative: -5

## Tabellen-Analyse

### Was du bei Tabellen prüfen sollst:
1. **Datenstruktur** - Sind Tabellen semantisch korrekt mit <th> und <td>?
2. **Überschriften** - Hat jede Spalte eine klare Überschrift?
3. **Vergleichstabellen** - Für Produktvergleiche ideal für AI-Zitation
4. **Responsive Design** - Sind Tabellen auf Mobile lesbar?
5. **Inhalt extrahieren** - Lies die wichtigsten Daten aus Tabellen

### Tabellen-bezogene GEO-Faktoren:
- Strukturierte Vergleichstabellen mit klaren Daten: +8 (ideal für AI-Zitation)
- Tabellen mit <th> Überschriften: +3
- Preistabellen mit klaren Optionen: +5
- Tabellen ohne Überschriften: -3
- Wichtige Daten nur als Bild-Tabelle: -8

## WICHTIG: Erkläre das "Warum" bei jeder Bewertung!

Bei jeder Weakness und Recommendation MUSST du erklären, WARUM das für GEO/KI-Sichtbarkeit relevant ist.

### Beispiele für gute Erklärungen:

❌ SCHLECHT: "Kein Direct Answer vorhanden"
✅ GUT: "Kein Direct Answer in ersten 40 Worten → KI-Systeme wie ChatGPT und Perplexity extrahieren bevorzugt die ersten Sätze einer Seite für ihre Antworten. Ohne prägnante Zusammenfassung am Anfang wird der Content seltener zitiert."

❌ SCHLECHT: "Bilder haben keine Alt-Texte"
✅ GUT: "3 Bilder ohne Alt-Text → KI-Crawler können Bildinhalte nicht verstehen. Wenn wichtige Informationen (z.B. Statistiken in Infografiken) nur visuell verfügbar sind, gehen diese für RAG-Systeme verloren."

❌ SCHLECHT: "noindex Meta-Tag gefunden"
✅ GUT: "noindex Meta-Tag blockiert Indexierung → KRITISCH: Die Seite wird von Suchmaschinen nicht indexiert. Da ChatGPT, Perplexity und Google AI Overviews ihre Daten aus Suchindizes beziehen, ist diese Seite für KI-Antworten unsichtbar."

## ANTWORTFORMAT (STRIKT JSON!)

Gib NUR dieses JSON zurück, KEIN anderer Text:

{
  "geoScore": <0-100>,
  "scoreSummary": "<1-2 Sätze Begründung>",
  "strengths": [
    {"title": "<Stärke>", "description": "<Erklärung mit GEO-Bezug UND warum das für KI-Sichtbarkeit hilft>"}
  ],
  "weaknesses": [
    {"priority": "KRITISCH|MITTEL|NIEDRIG", "title": "<Problem>", "description": "<Auswirkung auf KI-Sichtbarkeit MIT Erklärung warum>"}
  ],
  "recommendations": [
    {
      "timeframe": "SOFORT|KURZFRISTIG|MITTELFRISTIG",
      "action": "<Konkrete Maßnahme>",
      "reason": "<Begründung mit Fakten UND warum das für KI wichtig ist>",
      "impact": {
        "level": "HOCH|MITTEL|NIEDRIG",
        "percentage": "<z.B. '+30-40%' oder '+5-10%' oder 'Variabel'>",
        "source": "<z.B. 'Princeton GEO-BENCH' oder 'Google Guidelines' oder 'Best Practice'>"
      }
    }
  ],
  "nextStep": "<Ein sofort umsetzbarer Schritt>",
  "imageAnalysis": {
    "hasVisualContent": <true|false>,
    "textInImages": "<Erkannter Text aus Bildern/Grafiken>",
    "accessibilityIssues": ["<Liste von Accessibility-Problemen MIT Erklärung warum problematisch für KI>"],
    "recommendations": ["<Bild-spezifische Empfehlungen MIT GEO-Begründung>"]
  },
  "ctaAnalysis": {
    "primaryCta": "<Text des Haupt-CTAs oder null>",
    "ctaCount": <Anzahl gefundener CTAs>,
    "ctaQuality": "GUT|MITTEL|SCHLECHT",
    "ctaTexts": ["<Liste aller CTA-Texte>"],
    "issues": ["<CTA-bezogene Probleme>"]
  },
  "tableAnalysis": {
    "tableCount": <Anzahl Tabellen>,
    "hasComparisonTable": <true|false>,
    "hasPricingTable": <true|false>,
    "hasProperHeaders": <true|false>,
    "keyData": ["<Wichtige Daten aus Tabellen>"],
    "issues": ["<Tabellen-bezogene Probleme>"]
  }
}

## Detaillierte Bewertungskriterien (100 Punkte)

### 1. Content-Qualität & Zitierbarkeit (35 Punkte)
- Direct Answer in ersten 40-60 Worten (+10)
- Statistiken mit Quellen vorhanden (+10) - erhöht Sichtbarkeit 30-40%
- Einzigartige Informationen außerhalb LLM-Training (+10)
- Quellenangaben/Zitate eingebaut (+5)

### 2. Struktur & Formatierung (25 Punkte)
- Korrekte Heading-Hierarchie H1→H2→H3 (+8)
- H2s als Fragen formuliert (+7) - spiegeln Suchanfragen
- Listen (ul/ol) für Scanbarkeit (+5)
- TL;DR/Zusammenfassung am Anfang (+5)

### 3. Schema & Technisches (20 Punkte)
- JSON-LD Schema Markup vorhanden (+8)
- Passender Schema-Typ (Article, FAQ, HowTo) (+4)
- robots.txt erlaubt KI-Crawler (+5)
- Meta-Tags vollständig (+3)

### 4. E-E-A-T & Autorität (15 Punkte)
- Autor mit Name und Bio (+5)
- Publikations-/Aktualisierungsdatum (+4)
- Externe Links zu autoritativen Quellen (+3)
- Über-uns/Impressum vorhanden (+3)

### 5. Aktualität (5 Punkte)
- Aktuelle Jahreszahlen (2024/2025) im Content (+3)
- "Aktualisiert am" Datum vorhanden (+2)

## Negative Faktoren (Abzüge)
- **noindex Meta-Tag vorhanden: -30 (KRITISCH!)** - Seite wird nicht indexiert, KI kann nicht darauf zugreifen
- **nofollow Meta-Tag vorhanden: -10** - Links werden nicht verfolgt, schwächt Autorität
- Keine H1 oder mehrere H1: -10
- Heading-Ebenen übersprungen (H1→H3): -5
- Kein Schema Markup: -15
- KI-Crawler blockiert in robots.txt: -20 (KRITISCH!)
- Keine Statistiken/Zahlen: -10
- Keine Quellenangaben: -10
- Kein Autor erkennbar: -5
- Veraltete Inhalte (keine 2024/2025 Referenzen): -5
- Keyword Stuffing erkennbar: -10
- Wichtige Infos nur in Bildern: -10

## KI-Crawler (robots.txt Check)
Erlaubt sein sollten:
- GPTBot, ChatGPT-User (OpenAI)
- ClaudeBot, Claude-Web (Anthropic)
- PerplexityBot
- Google-Extended
- Amazonbot, cohere-ai

## Schema Markup Empfehlungen
- Article/BlogPosting + Author (Artikel)
- FAQPage (FAQ-Seiten)
- HowTo (Anleitungen)
- Organization (Unternehmen)
- BreadcrumbList (Navigation)
- Product + Review (Produkte)`

export async function analyzeWithClaude(url, pageContent, pageCode, imageSettings = {}) {
  const timer = startTimer()

  // Default image settings
  const settings = {
    includeScreenshot: imageSettings.includeScreenshot ?? true,
    includeImages: imageSettings.includeImages ?? true,
    maxImages: Math.min(5, Math.max(1, imageSettings.maxImages ?? 3))
  }

  // Pass browser-detected heading visibility for accurate H1 counting
  const textContent = extractTextContent(pageCode.html, pageCode.headingVisibility)

  // FIX: Get title and description from metaTags/metadata (extracted from rawHtml) because pageCode.html doesn't include <head>
  const descriptionFromMeta = pageCode.metaTags?.find(t => t.name?.toLowerCase() === 'description')?.content
  const ogDescFromMeta = pageCode.metaTags?.find(t => t.property?.toLowerCase() === 'og:description')?.content
  const actualDescription = descriptionFromMeta || ogDescFromMeta || textContent.description || ''

  // Also get title from Firecrawl metadata if available
  const actualTitle = pageCode.metadata?.title || textContent.title || ''

  // Format headings with question indicator
  const formattedHeadings = textContent.headings.map(h =>
    `${h.level.toUpperCase()}: "${h.text}"${h.isQuestion ? ' [FRAGE]' : ''}`
  ).join('\n')

  // Check robots.txt for AI crawlers using proper block parsing
  const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Amazonbot', 'cohere-ai']
  const blockedCrawlers = []
  const allowedCrawlers = []

  if (pageCode.robotsTxt) {
    // Parse robots.txt into User-Agent blocks
    const robotsBlocks = parseRobotsTxt(pageCode.robotsTxt)

    aiCrawlers.forEach(crawler => {
      const isBlocked = isCrawlerBlocked(crawler, robotsBlocks)
      if (isBlocked) {
        blockedCrawlers.push(crawler)
      } else {
        allowedCrawlers.push(crawler)
      }
    })
  }

  // Build image analysis section
  const imgAnalysis = textContent.structureAnalysis.imageAnalysis
  const imageAnalysisSection = imgAnalysis
    ? `
═══════════════════════════════════════════
BILD-ANALYSE (Alt-Texte)
═══════════════════════════════════════════

**Bilder gesamt:** ${imgAnalysis.total || 0}
**Mit Alt-Text:** ${imgAnalysis.withAlt || 0}
**Ohne Alt-Text:** ${imgAnalysis.withoutAlt || 0}

**Vorhandene Alt-Texte:**
${imgAnalysis.altTexts?.slice(0, 10).map(alt => `- "${alt}"`).join('\n') || 'Keine Alt-Texte gefunden'}
`
    : ''

  const userMessage = `Analysiere diese Webseite für GEO (Generative Engine Optimization):

URL: ${url}

═══════════════════════════════════════════
GRUNDLEGENDE INFORMATIONEN
═══════════════════════════════════════════

**Titel:** ${actualTitle || 'FEHLT!'}
**H1:** ${textContent.h1 || 'KEINE H1 GEFUNDEN!'}
**Meta-Description:** ${actualDescription || 'FEHLT!'}

═══════════════════════════════════════════
ÜBERSCHRIFTEN-ANALYSE (${textContent.headingAnalysis.total} gefunden)
═══════════════════════════════════════════

**Verteilung:** H1: ${textContent.headingAnalysis.counts.h1}, H2: ${textContent.headingAnalysis.counts.h2}, H3: ${textContent.headingAnalysis.counts.h3}, H4: ${textContent.headingAnalysis.counts.h4}, H5: ${textContent.headingAnalysis.counts.h5}, H6: ${textContent.headingAnalysis.counts.h6}

**Hierarchie korrekt:** ${textContent.headingAnalysis.hasProperHierarchy ? 'JA (genau 1x H1 + H2s vorhanden)' : 'NEIN - Problem!'}
**Mehrere H1:** ${textContent.headingAnalysis.multipleH1 ? 'JA - PROBLEM!' : 'Nein (gut)'}
**Übersprungene Ebenen:** ${textContent.headingAnalysis.missingLevels.length > 0 ? textContent.headingAnalysis.missingLevels.join(', ') + ' - PROBLEM!' : 'Keine (gut)'}
**Als Fragen formuliert:** ${textContent.headingAnalysis.questionsCount} von ${textContent.headingAnalysis.total} (${Math.round(textContent.headingAnalysis.questionsCount / textContent.headingAnalysis.total * 100) || 0}%)

**Alle Überschriften:**
${formattedHeadings || 'Keine Überschriften gefunden'}

═══════════════════════════════════════════
CONTENT-STRUKTUR ANALYSE
═══════════════════════════════════════════

**Wortanzahl:** ${textContent.structureAnalysis.wordCount} (Lesezeit: ~${textContent.structureAnalysis.estimatedReadTime} Min.)
**TL;DR/Zusammenfassung:** ${textContent.structureAnalysis.hasTldr ? 'JA vorhanden' : 'NICHT vorhanden'}
**Listen:** ${textContent.structureAnalysis.bulletLists} Aufzählungen, ${textContent.structureAnalysis.numberedLists} nummerierte Listen (${textContent.structureAnalysis.totalListItems} Items)
**Tabellen:** ${textContent.structureAnalysis.tableCount}
**Bilder:** ${textContent.structureAnalysis.hasImages}
**Videos:** ${textContent.structureAnalysis.hasVideos}

**Statistiken/Zahlen gefunden:** ${textContent.structureAnalysis.statisticsCount} ${textContent.structureAnalysis.hasStatistics ? '' : '- KEINE STATISTIKEN!'}
**Quellenangaben gefunden:** ${textContent.structureAnalysis.citationsCount} ${textContent.structureAnalysis.hasCitations ? '' : '- KEINE QUELLEN!'}
**Externe Links:** ${textContent.structureAnalysis.externalLinksCount}
**Aktuelle Jahreszahlen (2024/2025):** ${textContent.structureAnalysis.hasRecentData ? 'JA' : 'NEIN'}

**Erster Absatz (Direct Answer Check - erste 80 Worte):**
"${textContent.firstParagraph}"

═══════════════════════════════════════════
AUTOR & E-E-A-T SIGNALE
═══════════════════════════════════════════

**Autor erkennbar:** ${textContent.authorInfo.hasAuthor ? 'JA' : 'NEIN'}
**Autorname:** ${textContent.authorInfo.authorName || 'Nicht gefunden'}
**Autor-Bio vorhanden:** ${textContent.authorInfo.hasAuthorBio ? 'JA' : 'NEIN'}
**Publikationsdatum:** ${textContent.dateInfo.publishDate || 'Nicht gefunden'}
**Aktualisierungsdatum:** ${textContent.dateInfo.modifiedDate || 'Nicht gefunden'}

═══════════════════════════════════════════
TECHNISCHE ANALYSE
═══════════════════════════════════════════

**Meta-Tags (${pageCode.metaTags.length} gefunden):**
${pageCode.metaTags.slice(0, 15).map(t => `- ${t.name || t.property}: ${t.content?.substring(0, 80)}`).join('\n') || 'Keine Meta-Tags'}

**Schema Markup (JSON-LD):**
${pageCode.schemaMarkup.length > 0 ? JSON.stringify(pageCode.schemaMarkup, null, 2).substring(0, 2500) : 'KEIN SCHEMA MARKUP GEFUNDEN!'}

**robots.txt:**
${pageCode.robotsTxt ? pageCode.robotsTxt.substring(0, 800) : 'Keine robots.txt gefunden'}

**KI-Crawler Status:**
- Blockiert: ${blockedCrawlers.length > 0 ? blockedCrawlers.join(', ') : 'Keine'}
- Erlaubt/Nicht blockiert: ${allowedCrawlers.length > 0 ? allowedCrawlers.join(', ') : 'Keine Angabe'}

**Meta Robots Directives:** ${pageCode.robotsMeta ? formatRobotsMeta(pageCode.robotsMeta) : 'Keine gefunden'}

${imageAnalysisSection}

═══════════════════════════════════════════
FAQ-ELEMENTE (${textContent.faqItems.length} gefunden)
═══════════════════════════════════════════
${textContent.faqItems.length > 0 ? textContent.faqItems.slice(0, 10).join('\n') : 'Keine FAQ-Elemente gefunden'}

═══════════════════════════════════════════
CONTENT-AUSZUG
═══════════════════════════════════════════
${textContent.bodyText.substring(0, 3000)}

═══════════════════════════════════════════

Analysiere diese Daten und gib deine Bewertung als REINES JSON zurück (kein Markdown, kein Text davor/danach).
Sei konkret bei Empfehlungen - nenne spezifische Überschriften die geändert werden sollten, fehlende Elemente, etc.`

  // Helper to clean and validate base64 data
  function cleanBase64(data) {
    if (!data) return null

    let cleaned = data

    // Remove data URL prefix like "data:image/png;base64,"
    if (cleaned.startsWith('data:')) {
      const commaIndex = cleaned.indexOf(',')
      if (commaIndex !== -1) {
        cleaned = cleaned.substring(commaIndex + 1)
      }
    }

    // Remove whitespace and newlines
    cleaned = cleaned.replace(/\s/g, '')

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(cleaned)) {
      console.error('[AI] Invalid base64 data detected, first 100 chars:', cleaned.substring(0, 100))
      return null
    }

    // Check minimum length (a valid image should have some data)
    if (cleaned.length < 100) {
      console.error('[AI] Base64 data too short:', cleaned.length)
      return null
    }

    return cleaned
  }

  // Helper to extract media type from data URL
  function getMediaType(data, fallback = 'image/png') {
    if (!data) return fallback
    if (data.startsWith('data:')) {
      const match = data.match(/^data:([^;,]+)/)
      if (match) return match[1]
    }
    return fallback
  }

  // Valid media types for Claude Vision API
  const VALID_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  // Check if media type is valid for Claude
  function isValidMediaType(mediaType) {
    return VALID_MEDIA_TYPES.includes(mediaType)
  }

  // Normalize media type (handle variations like image/jpg)
  function normalizeMediaType(mediaType) {
    if (!mediaType) return null
    const normalized = mediaType.toLowerCase().split(';')[0].trim()

    // Handle jpeg variations
    if (normalized === 'image/jpg') return 'image/jpeg'

    return normalized
  }

  // Build message content array
  const messageContent = []

  // Add screenshot if available and enabled
  let screenshotIncluded = false
  if (settings.includeScreenshot && pageCode.screenshot) {
    const cleanedScreenshot = cleanBase64(pageCode.screenshot)
    const screenshotMediaType = normalizeMediaType(getMediaType(pageCode.screenshot))

    if (cleanedScreenshot && isValidMediaType(screenshotMediaType)) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: screenshotMediaType,
          data: cleanedScreenshot,
        },
      })
      screenshotIncluded = true
    } else {
      logWarning('Claude', `Screenshot übersprungen - ungültiges Format: ${screenshotMediaType}`)
    }
  }

  // Add individual images if available and enabled (with media type validation)
  let pageImagesIncluded = 0
  if (settings.includeImages && pageCode.images && pageCode.images.length > 0) {
    for (const img of pageCode.images.slice(0, settings.maxImages)) {
      const cleanedData = cleanBase64(img.base64)
      const normalizedType = normalizeMediaType(img.mediaType)

      if (cleanedData && isValidMediaType(normalizedType)) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: normalizedType,
            data: cleanedData,
          },
        })
        pageImagesIncluded++
      }
    }
  }

  // Add text content
  messageContent.push({
    type: 'text',
    text: userMessage,
  })

  // Add image analysis instructions if we have visual content
  const hasVisualContent = messageContent.some(c => c.type === 'image')
  const totalImages = (screenshotIncluded ? 1 : 0) + pageImagesIncluded

  // Calculate content sizes for logging
  const htmlLength = pageCode.html?.length || 0

  // Log the request details
  logRequest('Claude', 'ANALYZE', url, {
    'Model': 'claude-opus-4-5-20251101',
    'System': `${SYSTEM_PROMPT.length.toLocaleString()} chars`,
    'Images': `${totalImages} (${screenshotIncluded ? '1 screenshot' : 'kein screenshot'}${pageImagesIncluded > 0 ? ` + ${pageImagesIncluded} page` : ''})`,
    'HTML': formatSize(htmlLength)
  })

  if (hasVisualContent) {
    messageContent.push({
      type: 'text',
      text: `

═══════════════════════════════════════════
VISUELLE ANALYSE (DU SIEHST DIE BILDER!)
═══════════════════════════════════════════

Die Bilder oben zeigen dir die echte Webseite. Du KANNST und SOLLST diese visuell analysieren:

1. **Text aus Bildern extrahieren** - Lies JEDEN sichtbaren Text in Grafiken, Bannern, Screenshots
2. **Hero-Bereich beschreiben** - Was sieht der Nutzer zuerst? Welche Botschaft?
3. **Statistiken in Grafiken** - Erkenne Zahlen in Charts, Diagrammen, Infografiken
4. **UI/UX bewerten** - Sind Buttons klar? Navigation intuitiv? CTAs sichtbar?
5. **Design-Qualität** - Professionell? Vertrauenswürdig? Modern?
6. **Accessibility** - Kontraste ausreichend? Text lesbar?

FÜLLE das "imageAnalysis" Feld mit deinen visuellen Erkenntnissen:
- hasVisualContent: true
- textInImages: "Alle erkannten Texte aus den Bildern"
- accessibilityIssues: ["Gefundene Probleme"]
- recommendations: ["Visuelle Verbesserungsvorschläge"]`
    })
  }

  let message
  try {
    message = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: messageContent,
        }
      ],
      system: SYSTEM_PROMPT,
    })
  } catch (apiError) {
    const duration = getElapsed(timer)
    logError('Claude', apiError, {
      'Dauer': `${(duration / 1000).toFixed(1)}s`,
      'Model': 'claude-opus-4-5-20251101'
    })
    throw apiError
  }

  const duration = getElapsed(timer)

  // Extract JSON from response
  const responseText = message.content[0].text
  const inputTokens = message.usage?.input_tokens || 0
  const outputTokens = message.usage?.output_tokens || 0

  // Try to parse the response
  let parseSuccess = false
  let result = null

  try {
    // Try to parse directly
    result = JSON.parse(responseText)
    parseSuccess = true
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[1].trim())
        parseSuccess = true
      } catch (e2) {
        // Continue to next method
      }
    }

    // Try to find JSON object in text
    if (!parseSuccess) {
      const jsonStart = responseText.indexOf('{')
      const jsonEnd = responseText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          result = JSON.parse(responseText.substring(jsonStart, jsonEnd + 1))
          parseSuccess = true
        } catch (e3) {
          // Parse failed
        }
      }
    }
  }

  // Log response details
  logSuccessDetailed('Claude', duration, {
    'Tokens': `${inputTokens.toLocaleString()} in → ${outputTokens.toLocaleString()} out`,
    'Response': `${responseText.length.toLocaleString()} chars`,
    'Parse': parseSuccess ? '✓ JSON valid' : '✗ Parse fehlgeschlagen',
    'Score': result?.geoScore !== undefined ? `${result.geoScore}/100` : 'n/a'
  })

  if (!parseSuccess) {
    logError('Claude', 'JSON-Parse fehlgeschlagen', {
      'Response (Auszug)': responseText.substring(0, 300)
    })
    throw new Error('Could not parse AI response as JSON')
  }

  // Return with debug info attached
  result._debug = {
    duration,
    inputTokens,
    outputTokens,
    parseSuccess
  }

  return result
}

/**
 * Parse robots.txt into structured User-Agent blocks
 * Each block contains the user-agent(s) and their associated rules
 * @param {string} robotsTxt - Raw robots.txt content
 * @returns {Array} Array of blocks: { agents: string[], rules: { type: 'allow'|'disallow', path: string }[] }
 */
function parseRobotsTxt(robotsTxt) {
  const blocks = []
  let currentBlock = null

  const lines = robotsTxt.split('\n')

  for (let line of lines) {
    // Remove comments and trim
    const commentIndex = line.indexOf('#')
    if (commentIndex !== -1) {
      line = line.substring(0, commentIndex)
    }
    line = line.trim()

    if (!line) continue

    // Parse directive
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const directive = line.substring(0, colonIndex).trim().toLowerCase()
    const value = line.substring(colonIndex + 1).trim()

    if (directive === 'user-agent') {
      // Start new block or add to current multi-agent block
      if (!currentBlock || currentBlock.rules.length > 0) {
        // Start a new block
        currentBlock = { agents: [value.toLowerCase()], rules: [] }
        blocks.push(currentBlock)
      } else {
        // Add another agent to current block (multi-agent block)
        currentBlock.agents.push(value.toLowerCase())
      }
    } else if (directive === 'disallow' && currentBlock) {
      currentBlock.rules.push({ type: 'disallow', path: value || '' })
    } else if (directive === 'allow' && currentBlock) {
      currentBlock.rules.push({ type: 'allow', path: value || '' })
    }
    // Ignore other directives (Sitemap, Crawl-delay, etc.)
  }

  return blocks
}

/**
 * Check if a crawler is blocked by the robots.txt rules
 * @param {string} crawler - Crawler name (e.g., 'GPTBot')
 * @param {Array} blocks - Parsed robots.txt blocks
 * @returns {boolean} True if crawler is blocked from root path
 */
function isCrawlerBlocked(crawler, blocks) {
  const crawlerLower = crawler.toLowerCase()

  // Find the most specific matching block
  // Priority: exact match > wildcard (*)
  let matchingBlock = null

  for (const block of blocks) {
    for (const agent of block.agents) {
      if (agent === crawlerLower) {
        // Exact match - highest priority
        matchingBlock = block
        break
      }
    }
    if (matchingBlock) break
  }

  // If no exact match, fall back to wildcard
  if (!matchingBlock) {
    for (const block of blocks) {
      if (block.agents.includes('*')) {
        matchingBlock = block
        break
      }
    }
  }

  // No matching block means no restrictions
  if (!matchingBlock) return false

  // Check if root path "/" is blocked
  // Rules are processed in order, with more specific paths taking precedence
  // For simplicity, we check if there's a "Disallow: /" without a corresponding "Allow: /"
  let isRootBlocked = false

  for (const rule of matchingBlock.rules) {
    // Empty disallow means allow all
    if (rule.type === 'disallow' && rule.path === '') {
      continue
    }

    // Check if rule applies to root
    if (rule.path === '/' || rule.path === '/*') {
      if (rule.type === 'disallow') {
        isRootBlocked = true
      } else if (rule.type === 'allow') {
        isRootBlocked = false
      }
    }
  }

  return isRootBlocked
}

/**
 * Format robots meta information for display in AI prompt
 * @param {Object} robotsMeta - Extracted robots meta data
 * @returns {string} Formatted string for AI analysis
 */
function formatRobotsMeta(robotsMeta) {
  if (!robotsMeta || (!robotsMeta.hasNoindex && !robotsMeta.hasNofollow && robotsMeta.directives.length === 0)) {
    return 'Keine Einschränkungen (index, follow)'
  }

  const warnings = []

  if (robotsMeta.hasNoindex) {
    warnings.push('⚠️ NOINDEX - Seite wird NICHT indexiert!')
  }

  if (robotsMeta.hasNofollow) {
    warnings.push('⚠️ NOFOLLOW - Links werden nicht verfolgt')
  }

  if (robotsMeta.hasNone) {
    warnings.push('⚠️ NONE = noindex + nofollow')
  }

  // Show raw tags for context
  const tagsInfo = robotsMeta.rawTags.map(t => `${t.name}: "${t.content}"`).join(', ')

  return `${warnings.join(' | ')} (Tags: ${tagsInfo})`
}
