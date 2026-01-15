import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let brandContext = null

/**
 * Load and cache the Sage brand context
 */
function loadBrandContext() {
  if (!brandContext) {
    try {
      const contextPath = path.join(__dirname, '../../data/sageBrandContext.json')
      brandContext = JSON.parse(readFileSync(contextPath, 'utf-8'))
    } catch (error) {
      console.error('Failed to load brand context:', error)
      brandContext = { error: 'Brand context not available' }
    }
  }
  return brandContext
}

/**
 * Get available audiences for UI dropdown
 */
export function getAvailableAudiences() {
  const context = loadBrandContext()
  if (!context.audiences) return []

  return Object.entries(context.audiences).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description
  }))
}

/**
 * Get the brand context for API response
 */
export function getBrandContext() {
  return loadBrandContext()
}

/**
 * Generate brand-aware prompt addition for content generation
 * @param {Object} settings - Brand settings
 * @param {boolean} settings.useSageBrand - Whether to apply brand guidelines
 * @param {string} settings.targetAudience - Target audience key (e.g., 'smallBusiness')
 * @returns {string} Prompt addition or empty string
 */
export function getBrandPromptAddition(settings) {
  if (!settings?.useSageBrand) {
    return ''
  }

  const context = loadBrandContext()
  if (context.error) {
    return ''
  }

  const audience = settings.targetAudience || 'smallBusiness'
  const audienceData = context.audiences?.[audience]

  if (!audienceData) {
    console.warn(`Unknown audience: ${audience}, using smallBusiness`)
  }

  const selectedAudience = audienceData || context.audiences?.smallBusiness

  // Build the brand guidelines prompt
  let promptAddition = `
## Sage Tone of Voice Guidelines

Du schreibst Content fuer Sage, ein fuehrendes Unternehmen fuer Business-Software.
Wende diese Prinzipien an:

`

  // Add tone of voice principles
  context.toneOfVoice?.principles?.forEach(principle => {
    promptAddition += `### ${principle.name}
${principle.description}
- DO: ${principle.dos.slice(0, 2).join(', ')}
- DON'T: ${principle.donts.slice(0, 2).join(', ')}

`
  })

  // Add audience-specific guidance
  if (selectedAudience) {
    promptAddition += `## Zielgruppe: ${selectedAudience.name}
${selectedAudience.description}

**Fokus-Themen:** ${selectedAudience.focus.join(', ')}

**Messaging-Hinweise:**
${selectedAudience.messagingGuidance.map(m => `- ${m}`).join('\n')}

`
  }

  // Add content guidelines
  if (context.contentGuidelines) {
    promptAddition += `## Content-Richtlinien

**Headlines:** ${context.contentGuidelines.headlines?.style}
**CTAs:** ${context.contentGuidelines.cta?.style}
**Unterstuetzender Text:** ${context.contentGuidelines.supportiveText?.style}
`
  }

  return promptAddition
}

/**
 * Transform a generic text into Sage brand voice
 * @param {string} text - Original text
 * @param {Object} settings - Brand settings
 * @returns {string} Prompt for transforming the text
 */
export function getTransformPrompt(text, settings) {
  const brandAddition = getBrandPromptAddition(settings)

  if (!brandAddition) {
    return null
  }

  return `${brandAddition}

## Aufgabe

Transformiere den folgenden Text in Sage Brand Voice.
Behalte die Kernaussagen bei, passe aber Ton, Stil und Formulierung an die Sage-Richtlinien an.

**Originaltext:**
${text}

**Transformierter Text:**
`
}

export default {
  getBrandPromptAddition,
  getAvailableAudiences,
  getBrandContext,
  getTransformPrompt
}
