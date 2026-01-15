/**
 * SERP Click-Worthiness Analysis Service
 * Analyzes meta-data for search result optimization
 */

// Attention trigger keywords (DE + EN)
const ATTENTION_KEYWORDS = [
  { keyword: 'KI', variants: ['KI', 'AI', 'Kuenstliche Intelligenz', 'Artificial Intelligence', 'AI-powered', 'KI-gestuetzt'] },
  { keyword: 'All-in-one', variants: ['All-in-one', 'Alles-in-einem', 'Komplettloesung', 'Complete Solution'] },
  { keyword: 'KMU', variants: ['KMU', 'SME', 'Mittelstand', 'Small Business', 'Kleinunternehmen'] },
  { keyword: 'Integration', variants: ['Integration', 'Schnittstelle', 'API', 'Connect', 'Anbindung'] },
  { keyword: 'Kostenlos', variants: ['Kostenlos', 'Free', 'Gratis', 'Free Trial', 'Testversion', 'Demo'] },
  { keyword: 'Automatisierung', variants: ['Automatisierung', 'Automation', 'Automatisch', 'Automated'] },
  { keyword: 'Cloud', variants: ['Cloud', 'Online', 'SaaS', 'Browser-basiert'] },
  { keyword: 'Sicher', variants: ['Sicher', 'Secure', 'DSGVO', 'GDPR', 'Datenschutz', 'Verschluesselt'] }
]

// B2B signal keywords
const B2B_SIGNALS = [
  'Enterprise', 'Business', 'Professional', 'Pro', 'Team', 'Teams',
  'Unternehmen', 'Firma', 'Betrieb', 'Gewerbe', 'B2B',
  'Buchhaltung', 'Accounting', 'ERP', 'CRM', 'HR',
  'Lohnabrechnung', 'Payroll', 'Rechnungen', 'Invoice'
]

// Trust trigger keywords
const TRUST_TRIGGERS = [
  'Trusted', 'Vertraut', 'Kunden', 'Customers', 'Users',
  'Award', 'Auszeichnung', 'Zertifiziert', 'Certified',
  'Jahre', 'Years', 'Erfahrung', 'Experience',
  'Millionen', 'Million', 'Tausende', 'Thousands',
  'Nr.', '#1', 'Marktfuehrer', 'Leader', 'Best', 'Top'
]

/**
 * Analyze title tag quality
 */
function analyzeTitleQuality(title) {
  const issues = []
  const suggestions = []
  let score = 100

  if (!title) {
    return {
      score: 0,
      label: 'Fehlt',
      issues: ['Kein Title-Tag vorhanden'],
      suggestions: ['Title-Tag mit 30-60 Zeichen hinzufuegen']
    }
  }

  const length = title.length

  // Length checks
  if (length < 30) {
    score -= 30
    issues.push(`Title zu kurz (${length} Zeichen)`)
    suggestions.push('Title auf mindestens 30 Zeichen erweitern')
  } else if (length > 60) {
    score -= 20
    issues.push(`Title zu lang (${length} Zeichen) - wird abgeschnitten`)
    suggestions.push('Title auf maximal 60 Zeichen kuerzen')
  }

  // Brand at end check (good practice)
  if (!title.includes('|') && !title.includes('-') && !title.includes(':')) {
    score -= 10
    suggestions.push('Markenname am Ende mit Separator (| oder -) hinzufuegen')
  }

  // All caps check
  if (title === title.toUpperCase() && title.length > 10) {
    score -= 15
    issues.push('Title komplett in Grossbuchstaben')
    suggestions.push('Mixed Case verwenden fuer bessere Lesbarkeit')
  }

  const label = score >= 80 ? 'Gut' : score >= 50 ? 'Verbesserungswuerdig' : 'Kritisch'

  return { score: Math.max(0, score), label, issues, suggestions }
}

/**
 * Analyze meta description quality
 */
function analyzeDescriptionQuality(description) {
  const issues = []
  const suggestions = []
  let score = 100

  if (!description) {
    return {
      score: 0,
      label: 'Fehlt',
      issues: ['Keine Meta-Description vorhanden'],
      suggestions: ['Meta-Description mit 120-160 Zeichen hinzufuegen']
    }
  }

  const length = description.length

  // Length checks
  if (length < 120) {
    score -= 25
    issues.push(`Description zu kurz (${length} Zeichen)`)
    suggestions.push('Description auf mindestens 120 Zeichen erweitern')
  } else if (length > 160) {
    score -= 15
    issues.push(`Description zu lang (${length} Zeichen) - wird abgeschnitten`)
    suggestions.push('Description auf maximal 160 Zeichen kuerzen')
  }

  // CTA check
  const ctaPatterns = ['jetzt', 'heute', 'erfahren', 'entdecken', 'testen', 'starten', 'learn', 'discover', 'try', 'start', 'get']
  const hasCta = ctaPatterns.some(cta => description.toLowerCase().includes(cta))
  if (!hasCta) {
    score -= 15
    suggestions.push('Call-to-Action hinzufuegen (z.B. "Jetzt entdecken")')
  }

  // USP check - does it mention a benefit?
  const benefitPatterns = ['sparen', 'save', 'schneller', 'faster', 'einfach', 'easy', 'automatisch', 'automatic', 'kostenlos', 'free']
  const hasBenefit = benefitPatterns.some(b => description.toLowerCase().includes(b))
  if (!hasBenefit) {
    score -= 10
    suggestions.push('Nutzenversprechen/USP einbauen')
  }

  const label = score >= 80 ? 'Gut' : score >= 50 ? 'Verbesserungswuerdig' : 'Kritisch'

  return { score: Math.max(0, score), label, issues, suggestions }
}

/**
 * Analyze B2B signals in content
 */
function analyzeB2BSignals(title, description) {
  const combined = `${title || ''} ${description || ''}`.toLowerCase()
  const foundSignals = B2B_SIGNALS.filter(signal => combined.includes(signal.toLowerCase()))

  let score = Math.min(100, foundSignals.length * 20)
  const issues = []
  const suggestions = []

  if (foundSignals.length === 0) {
    issues.push('Keine B2B-Signale erkennbar')
    suggestions.push('B2B-relevante Keywords einbauen (z.B. "Business", "Unternehmen")')
  } else if (foundSignals.length < 2) {
    suggestions.push('Weitere B2B-Signale koennen Relevanz staerken')
  }

  const label = score >= 60 ? 'Gut' : score >= 30 ? 'Vorhanden' : 'Fehlt'

  return { score, label, issues, suggestions }
}

/**
 * Analyze trust triggers
 */
function analyzeTrustTriggers(title, description) {
  const combined = `${title || ''} ${description || ''}`.toLowerCase()
  const foundTriggers = TRUST_TRIGGERS.filter(trigger => combined.includes(trigger.toLowerCase()))

  // Check for numbers (social proof)
  const hasNumbers = /\d+/.test(combined)

  let score = Math.min(100, foundTriggers.length * 25 + (hasNumbers ? 20 : 0))
  const issues = []
  const suggestions = []

  if (foundTriggers.length === 0 && !hasNumbers) {
    issues.push('Keine Vertrauenssignale erkennbar')
    suggestions.push('Social Proof einbauen (z.B. "Ueber 10.000 Kunden")')
  }

  if (!hasNumbers) {
    suggestions.push('Konkrete Zahlen erhoehen Glaubwuerdigkeit')
  }

  const label = score >= 60 ? 'Stark' : score >= 30 ? 'Vorhanden' : 'Fehlt'

  return { score, label, issues, suggestions }
}

/**
 * Analyze feature clarity
 */
function analyzeFeatureClarity(title, description) {
  const combined = `${title || ''} ${description || ''}`
  let score = 70 // Base score
  const issues = []
  const suggestions = []

  // Check for clear feature/benefit statements
  const featurePatterns = [
    /fuer\s+\w+/i, /for\s+\w+/i,  // "fuer Buchhaltung", "for accounting"
    /mit\s+\w+/i, /with\s+\w+/i,  // "mit Automatisierung"
    /software|tool|loesung|solution|app|platform/i
  ]

  const hasFeature = featurePatterns.some(pattern => pattern.test(combined))
  if (hasFeature) {
    score += 20
  } else {
    issues.push('Unklarer Produktnutzen')
    suggestions.push('Konkreten Nutzen oder Feature im Title/Description nennen')
  }

  // Check for vague marketing speak
  const vagueTerms = ['beste', 'best', 'fuehrend', 'leading', 'innovative', 'revolutionaer']
  const hasVague = vagueTerms.some(term => combined.toLowerCase().includes(term))
  if (hasVague && !hasFeature) {
    score -= 15
    issues.push('Vage Marketing-Sprache ohne konkreten Nutzen')
    suggestions.push('Konkrete Features statt allgemeiner Superlative verwenden')
  }

  const label = score >= 70 ? 'Klar' : score >= 40 ? 'Unklar' : 'Verwirrend'

  return { score: Math.max(0, Math.min(100, score)), label, issues, suggestions }
}

/**
 * Analyze video content signals
 */
function analyzeVideoContent(schemaMarkup) {
  let score = 0
  const issues = []
  const suggestions = []

  if (!schemaMarkup || !Array.isArray(schemaMarkup)) {
    return {
      score: 0,
      label: 'Kein Video',
      issues: ['Kein Video-Schema gefunden'],
      suggestions: ['Video-Content mit VideoObject Schema kann Rich Results ermoeglichen']
    }
  }

  // Check for video schema
  const hasVideoSchema = schemaMarkup.some(schema => {
    const type = schema['@type']
    return type === 'VideoObject' || type === 'Video' ||
           (Array.isArray(type) && type.includes('VideoObject'))
  })

  if (hasVideoSchema) {
    score = 100
    return {
      score,
      label: 'Vorhanden',
      issues: [],
      suggestions: []
    }
  }

  // Check for YouTube/video mentions in schemas
  const hasVideoMention = schemaMarkup.some(schema => {
    const str = JSON.stringify(schema).toLowerCase()
    return str.includes('youtube') || str.includes('video') || str.includes('vimeo')
  })

  if (hasVideoMention) {
    score = 50
    suggestions.push('VideoObject Schema fuer bessere Video-Darstellung hinzufuegen')
  }

  return {
    score,
    label: score > 0 ? 'Teilweise' : 'Kein Video',
    issues,
    suggestions
  }
}

/**
 * Find attention triggers in title and description
 */
function findAttentionTriggers(title, description) {
  const titleLower = (title || '').toLowerCase()
  const descLower = (description || '').toLowerCase()

  return ATTENTION_KEYWORDS.map(({ keyword, variants }) => {
    const inTitle = variants.some(v => titleLower.includes(v.toLowerCase()))
    const inDesc = variants.some(v => descLower.includes(v.toLowerCase()))

    let location = 'none'
    if (inTitle && inDesc) location = 'both'
    else if (inTitle) location = 'title'
    else if (inDesc) location = 'description'

    return {
      keyword,
      found: inTitle || inDesc,
      location
    }
  })
}

/**
 * Generate SERP preview data
 */
function generateSerpPreview(title, description, url) {
  // Generate display URL (breadcrumb style)
  let displayUrl = url
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    displayUrl = urlObj.hostname
    if (pathParts.length > 0) {
      displayUrl += ' > ' + pathParts.slice(0, 2).join(' > ')
    }
  } catch {
    // Keep original URL if parsing fails
  }

  return {
    title: title || 'Kein Title vorhanden',
    displayUrl,
    description: description || 'Keine Meta-Description vorhanden',
    truncatedTitle: (title?.length || 0) > 60,
    truncatedDescription: (description?.length || 0) > 160
  }
}

/**
 * Generate recommendations based on metrics
 */
function generateSerpRecommendations(metrics) {
  const recommendations = []

  // Title recommendations
  if (metrics.titleQuality.score < 70) {
    recommendations.push({
      priority: metrics.titleQuality.score < 40 ? 'HOCH' : 'MITTEL',
      action: metrics.titleQuality.suggestions[0] || 'Title-Tag optimieren',
      currentValue: `Score: ${metrics.titleQuality.score}`,
      suggestedValue: 'Score: 80+'
    })
  }

  // Description recommendations
  if (metrics.descriptionQuality.score < 70) {
    recommendations.push({
      priority: metrics.descriptionQuality.score < 40 ? 'HOCH' : 'MITTEL',
      action: metrics.descriptionQuality.suggestions[0] || 'Meta-Description optimieren',
      currentValue: `Score: ${metrics.descriptionQuality.score}`,
      suggestedValue: 'Score: 80+'
    })
  }

  // Trust triggers
  if (metrics.trustTriggers.score < 30) {
    recommendations.push({
      priority: 'MITTEL',
      action: 'Vertrauenssignale einbauen (Kundenzahlen, Awards, Erfahrung)',
      currentValue: 'Keine Trust Signals',
      suggestedValue: 'Min. 1 Trust Signal'
    })
  }

  // B2B signals
  if (metrics.b2bSignals.score < 30) {
    recommendations.push({
      priority: 'NIEDRIG',
      action: 'B2B-Relevanz durch entsprechende Keywords signalisieren',
      currentValue: 'Keine B2B Signals',
      suggestedValue: 'Min. 1-2 B2B Keywords'
    })
  }

  return recommendations
}

/**
 * Calculate weighted click-worthiness score
 * Weights: Title 25%, Description 25%, B2B 15%, Trust 15%, Clarity 15%, Video 5%
 */
function calculateWeightedScore(metrics) {
  const weights = {
    titleQuality: 0.25,
    descriptionQuality: 0.25,
    b2bSignals: 0.15,
    trustTriggers: 0.15,
    featureClarity: 0.15,
    videoContent: 0.05
  }

  let totalScore = 0
  for (const [key, weight] of Object.entries(weights)) {
    totalScore += (metrics[key]?.score || 0) * weight
  }

  return Math.round(totalScore)
}

/**
 * Main analysis function
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} url - Page URL
 * @param {object[]} schemaMarkup - JSON-LD schema objects
 * @returns {object} Complete SERP analysis
 */
export function analyzeSerpFactors(title, description, url, schemaMarkup) {
  const metrics = {
    titleQuality: analyzeTitleQuality(title),
    descriptionQuality: analyzeDescriptionQuality(description),
    b2bSignals: analyzeB2BSignals(title, description),
    trustTriggers: analyzeTrustTriggers(title, description),
    featureClarity: analyzeFeatureClarity(title, description),
    videoContent: analyzeVideoContent(schemaMarkup)
  }

  const clickWorthinessScore = calculateWeightedScore(metrics)

  return {
    clickWorthinessScore,
    metrics,
    attentionTriggers: findAttentionTriggers(title, description),
    serpPreview: generateSerpPreview(title, description, url),
    recommendations: generateSerpRecommendations(metrics)
  }
}

export default {
  analyzeSerpFactors
}
