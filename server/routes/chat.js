import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = express.Router()

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const CHAT_SYSTEM_PROMPT = `Du bist ein freundlicher GEO-Experte (Generative Engine Optimization) und hilfst dem Nutzer, seine Webseite für KI-Suchmaschinen zu optimieren.

Du hast gerade eine GEO-Analyse fuer eine Webseite durchgefuehrt. Der Nutzer kann dir jetzt Fragen zur Analyse stellen.

Deine Aufgaben:
- Erklaere die Analyse-Ergebnisse verstaendlich
- Gib konkrete, umsetzbare Tipps
- Beantworte Fragen zu GEO-Best-Practices
- Hilf bei der Priorisierung von Massnahmen
- Erklaere technische Konzepte einfach

Antworte immer auf Deutsch, freundlich und hilfreich. Halte deine Antworten praegnant (max. 2-3 Absaetze).`

router.post('/', async (req, res) => {
  try {
    const { message, context, history = [] } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Nachricht ist erforderlich' })
    }

    // Build context message
    const contextMessage = `
ANALYSE-KONTEXT:
URL: ${context.url}
GEO-Score: ${context.geoScore}/100
Zusammenfassung: ${context.scoreSummary}

Staerken:
${context.strengths?.map(s => `- ${s.title}: ${s.description}`).join('\n') || 'Keine'}

Schwaechen:
${context.weaknesses?.map(w => `- [${w.priority}] ${w.title}: ${w.description}`).join('\n') || 'Keine'}

Empfehlungen:
${context.recommendations?.map(r => `- [${r.timeframe}] ${r.action}: ${r.reason}`).join('\n') || 'Keine'}
`

    // Build messages array
    const messages = [
      {
        role: 'user',
        content: contextMessage,
      },
      {
        role: 'assistant',
        content: 'Ich habe die GEO-Analyse verstanden. Wie kann ich dir helfen?',
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    const response = await client.messages.create({
      model: 'claude-opus-4-5-20250514',
      max_tokens: 1024,
      system: CHAT_SYSTEM_PROMPT,
      messages,
    })

    const assistantMessage = response.content[0].text

    res.json({ response: assistantMessage })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      error: error.message || 'Chat fehlgeschlagen',
    })
  }
})

export default router
