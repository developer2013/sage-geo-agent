import Anthropic from '@anthropic-ai/sdk'
import { extractTextContent } from './scraperService.js'

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

## Bildanalyse für GEO

Analysiere auch die visuellen Elemente der Seite (falls Screenshot/Bilder vorhanden):
- Text in Bildern/Grafiken (wichtig für Accessibility und AI-Lesbarkeit)
- Infografiken mit Statistiken
- UI-Elemente und deren Beschriftungen
- Alt-Texte prüfen ob vorhanden und aussagekräftig

### Bildbasierte GEO-Faktoren:
- Bilder ohne Alt-Text: -5 Punkte (pro Bild bis max -15)
- Wichtige Infos NUR in Bildern ohne Text-Alternative: -10
- Gute Alt-Texte mit Keywords: +3
- Infografiken mit zugänglichen Daten: +5
- Text in Bildern der auch im HTML steht: Neutral
- Wichtige Statistiken nur als Grafik: -5

## ANTWORTFORMAT (STRIKT JSON!)

Gib NUR dieses JSON zurück, KEIN anderer Text:

{
  "geoScore": <0-100>,
  "scoreSummary": "<1-2 Sätze Begründung>",
  "strengths": [
    {"title": "<Stärke>", "description": "<Erklärung mit GEO-Bezug>"}
  ],
  "weaknesses": [
    {"priority": "KRITISCH|MITTEL|NIEDRIG", "title": "<Problem>", "description": "<Auswirkung auf KI-Sichtbarkeit>"}
  ],
  "recommendations": [
    {"timeframe": "SOFORT|KURZFRISTIG|MITTELFRISTIG", "action": "<Konkrete Maßnahme>", "reason": "<Begründung mit Fakten>"}
  ],
  "nextStep": "<Ein sofort umsetzbarer Schritt>",
  "imageAnalysis": {
    "hasVisualContent": <true|false>,
    "textInImages": "<Erkannter Text aus Bildern/Grafiken>",
    "accessibilityIssues": ["<Liste von Accessibility-Problemen>"],
    "recommendations": ["<Bild-spezifische Empfehlungen>"]
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

export async function analyzeWithClaude(url, pageContent, pageCode) {
  const textContent = extractTextContent(pageCode.html)

  // Format headings with question indicator
  const formattedHeadings = textContent.headings.map(h =>
    `${h.level.toUpperCase()}: "${h.text}"${h.isQuestion ? ' [FRAGE]' : ''}`
  ).join('\n')

  // Check robots.txt for AI crawlers
  const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Amazonbot', 'cohere-ai']
  const blockedCrawlers = []
  const allowedCrawlers = []

  if (pageCode.robotsTxt) {
    aiCrawlers.forEach(crawler => {
      const regex = new RegExp(`User-agent:\\s*${crawler}[\\s\\S]*?Disallow:\\s*/`, 'i')
      if (regex.test(pageCode.robotsTxt)) {
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

**Titel:** ${textContent.title || 'FEHLT!'}
**H1:** ${textContent.h1 || 'KEINE H1 GEFUNDEN!'}
**Meta-Description:** ${textContent.description || 'FEHLT!'}

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

  // Build message content array
  const messageContent = []

  // Add screenshot if available (from Firecrawl)
  if (pageCode.screenshot) {
    console.log('[AI] Screenshot data type:', typeof pageCode.screenshot)
    console.log('[AI] Screenshot first 100 chars:', String(pageCode.screenshot).substring(0, 100))
    console.log('[AI] Screenshot length:', String(pageCode.screenshot).length)

    const cleanedScreenshot = cleanBase64(pageCode.screenshot)
    if (cleanedScreenshot) {
      console.log('[AI] Adding cleaned screenshot, length:', cleanedScreenshot.length)
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: getMediaType(pageCode.screenshot),
          data: cleanedScreenshot,
        },
      })
    } else {
      console.log('[AI] Screenshot skipped - invalid base64')
    }
  }

  // Add individual images if available (skip for now to debug)
  if (pageCode.images && pageCode.images.length > 0) {
    console.log(`[AI] Found ${pageCode.images.length} images, validating...`)
    let addedImages = 0
    for (const img of pageCode.images.slice(0, 3)) {
      const cleanedData = cleanBase64(img.base64)
      if (cleanedData && img.mediaType) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: cleanedData,
          },
        })
        addedImages++
      }
    }
    console.log(`[AI] Added ${addedImages} valid images`)
  }

  // Add text content
  messageContent.push({
    type: 'text',
    text: userMessage,
  })

  // Add image analysis instructions if we have visual content
  if (pageCode.screenshot || (pageCode.images && pageCode.images.length > 0)) {
    messageContent.push({
      type: 'text',
      text: `

WICHTIG - BILDANALYSE:
Du siehst oben einen Screenshot der Webseite und/oder einzelne Bilder. Bitte analysiere:
1. Welcher Text ist in den Bildern/Grafiken sichtbar?
2. Gibt es Infografiken mit wichtigen Statistiken?
3. Sind UI-Elemente gut beschriftet?
4. Welche wichtigen Informationen sind NUR als Bild vorhanden (nicht im HTML)?
5. Gibt es Accessibility-Probleme bei der Bildnutzung?

Füge deine Bildanalyse in das "imageAnalysis" Feld der JSON-Antwort ein.`
    })
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-5-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: messageContent,
      }
    ],
    system: SYSTEM_PROMPT,
  })

  // Extract JSON from response
  const responseText = message.content[0].text

  try {
    // Try to parse directly
    return JSON.parse(responseText)
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }

    // Try to find JSON object in text
    const jsonStart = responseText.indexOf('{')
    const jsonEnd = responseText.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(responseText.substring(jsonStart, jsonEnd + 1))
    }

    throw new Error('Could not parse AI response as JSON')
  }
}
