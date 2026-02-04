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
 * Generate brand-aware prompt addition for content generation (English)
 * @param {Object} settings - Brand settings
 * @param {boolean} settings.useSageBrand - Whether to apply brand guidelines
 * @param {string} settings.targetAudience - Target audience key (e.g., 'smallBusiness')
 * @returns {string} Prompt addition or empty string
 */
export function getBrandPromptAdditionEn(settings) {
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

You are writing content for Sage, a leading business software company.
Apply these principles:

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
    promptAddition += `## Target Audience: ${selectedAudience.name}
${selectedAudience.description}

**Focus Topics:** ${selectedAudience.focus.join(', ')}

**Messaging Guidelines:**
${selectedAudience.messagingGuidance.map(m => `- ${m}`).join('\n')}

`
  }

  // Add content guidelines
  if (context.contentGuidelines) {
    promptAddition += `## Content Guidelines

**Headlines:** ${context.contentGuidelines.headlines?.style}
**CTAs:** ${context.contentGuidelines.cta?.style}
**Supporting Text:** ${context.contentGuidelines.supportiveText?.style}
`
  }

  return promptAddition
}

/**
 * Transform a generic text into Sage brand voice (English)
 * @param {string} text - Original text
 * @param {Object} settings - Brand settings
 * @returns {string} Prompt for transforming the text
 */
export function getTransformPromptEn(text, settings) {
  const brandAddition = getBrandPromptAdditionEn(settings)

  if (!brandAddition) {
    return null
  }

  return `${brandAddition}

## Task

Transform the following text into Sage Brand Voice.
Keep the core messages but adapt tone, style, and phrasing to the Sage guidelines.

**Original Text:**
${text}

**Transformed Text:**
`
}

export default {
  getBrandPromptAdditionEn,
  getTransformPromptEn
}
