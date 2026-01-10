import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { saveChatMessage, getChatMessages } from '../services/dbService.js'
import { scrapeWithFirecrawl, isFirecrawlAvailable } from '../services/firecrawlService.js'

const router = express.Router()

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Tools for Claude to use
const tools = [
  {
    name: 'fetch_webpage',
    description: 'Ruft eine Webseite ab und gibt den Inhalt zurück. Nutze dieses Tool wenn der Nutzer nach Informationen von einer bestimmten URL fragt, eine Seite analysieren möchte, oder Inhalte einer Webseite benötigt.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Die vollständige URL der Webseite (z.B. https://example.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'compare_pages',
    description: 'Vergleicht zwei Webseiten miteinander. Nutze dieses Tool wenn der Nutzer zwei Seiten vergleichen möchte.',
    input_schema: {
      type: 'object',
      properties: {
        url1: {
          type: 'string',
          description: 'Die erste URL zum Vergleich'
        },
        url2: {
          type: 'string',
          description: 'Die zweite URL zum Vergleich'
        }
      },
      required: ['url1', 'url2']
    }
  }
]

const CHAT_SYSTEM_PROMPT = `Du bist ein freundlicher GEO-Experte (Generative Engine Optimization) mit der Fähigkeit, Webseiten in Echtzeit abzurufen und zu analysieren.

## Deine Fähigkeiten:
1. **Webseiten abrufen**: Du kannst jede URL mit dem fetch_webpage Tool laden und analysieren
2. **Seiten vergleichen**: Du kannst zwei Seiten mit compare_pages vergleichen
3. **GEO-Analyse**: Du kennst alle Best Practices für KI-Sichtbarkeit

## Wann du Tools nutzen sollst:
- Wenn der Nutzer eine URL erwähnt und Infos dazu möchte → fetch_webpage
- Wenn der Nutzer "schau dir mal X an" sagt → fetch_webpage
- Wenn der Nutzer zwei Seiten vergleichen will → compare_pages
- Wenn der Nutzer nach dem aktuellen Stand einer Seite fragt → fetch_webpage

## Wichtig:
- Antworte IMMER auf Deutsch
- Sei konkret und hilfreich
- Wenn du eine Seite abrufst, fasse die wichtigsten GEO-relevanten Punkte zusammen
- Vergleiche immer mit GEO-Best-Practices

## GEO-Checkliste für Seitenanalysen:
- Meta-Tags (Title, Description)
- Überschriften-Struktur (H1, H2, H3)
- Schema Markup (JSON-LD)
- Statistiken und Quellenangaben
- Autor-Informationen (E-E-A-T)
- Aktualität der Inhalte`

// Helper to extract text content from HTML for chat context
function extractSimpleContent(html, markdown) {
  if (markdown) {
    return markdown.substring(0, 8000)
  }

  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.substring(0, 8000)
}

// Execute tool calls
async function executeToolCall(toolName, toolInput) {
  console.log(`[Chat] Executing tool: ${toolName}`, toolInput)

  if (toolName === 'fetch_webpage') {
    try {
      let url = toolInput.url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      if (!isFirecrawlAvailable()) {
        return { error: 'Firecrawl ist nicht konfiguriert. Webseiten können nicht abgerufen werden.' }
      }

      console.log(`[Chat] Fetching URL: ${url}`)
      const result = await scrapeWithFirecrawl(url)
      const content = extractSimpleContent(result.html, result.markdown)

      return {
        url: url,
        title: result.metadata?.title || 'Unbekannt',
        description: result.metadata?.description || '',
        content: content,
        success: true
      }
    } catch (error) {
      console.error(`[Chat] Error fetching ${toolInput.url}:`, error.message)
      return { error: `Konnte ${toolInput.url} nicht abrufen: ${error.message}` }
    }
  }

  if (toolName === 'compare_pages') {
    try {
      const results = await Promise.all([
        executeToolCall('fetch_webpage', { url: toolInput.url1 }),
        executeToolCall('fetch_webpage', { url: toolInput.url2 })
      ])

      return {
        page1: results[0],
        page2: results[1],
        success: !results[0].error && !results[1].error
      }
    } catch (error) {
      return { error: `Vergleich fehlgeschlagen: ${error.message}` }
    }
  }

  return { error: `Unbekanntes Tool: ${toolName}` }
}

// Get chat history for an analysis
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params
    const messages = getChatMessages(analysisId)
    res.json({ messages })
  } catch (error) {
    console.error('Error getting chat history:', error)
    res.status(500).json({ error: 'Konnte Chat-Verlauf nicht laden' })
  }
})

// Streaming chat endpoint
router.post('/stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const { message, analysisId, context, history = [] } = req.body

    if (!message || !analysisId) {
      res.write(`data: ${JSON.stringify({ error: 'Nachricht und Analyse-ID sind erforderlich' })}\n\n`)
      res.end()
      return
    }

    // Save user message
    saveChatMessage(analysisId, 'user', message)

    // Build context message
    const contextMessage = `
AKTUELLE ANALYSE-KONTEXT:
URL: ${context.url}
GEO-Score: ${context.geoScore}/100
Zusammenfassung: ${context.scoreSummary}

Staerken:
${context.strengths?.map(s => `- ${s.title}: ${s.description}`).join('\n') || 'Keine'}

Schwaechen:
${context.weaknesses?.map(w => `- [${w.priority}] ${w.title}: ${w.description}`).join('\n') || 'Keine'}

Empfehlungen:
${context.recommendations?.map(r => `- [${r.timeframe}] ${r.action}: ${r.reason}`).join('\n') || 'Keine'}

Du kannst jederzeit andere URLs abrufen, wenn der Nutzer danach fragt.
`

    // Build messages array
    const messages = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: 'Ich habe die GEO-Analyse verstanden und kann jederzeit weitere Webseiten abrufen. Wie kann ich dir helfen?' },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ]

    let fullResponse = ''
    let toolUseBlocks = []
    let currentToolUse = null

    // Recursive function to handle streaming with tool use
    async function streamResponse(msgs) {
      const stream = await client.messages.stream({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        tools: tools,
        messages: msgs,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              input: ''
            }
            // Notify frontend that tool is being used
            res.write(`data: ${JSON.stringify({ type: 'tool_start', tool: event.content_block.name })}\n\n`)
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const text = event.delta.text
            fullResponse += text
            res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
          } else if (event.delta.type === 'input_json_delta') {
            if (currentToolUse) {
              currentToolUse.input += event.delta.partial_json
            }
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolUse) {
            try {
              currentToolUse.input = JSON.parse(currentToolUse.input)
            } catch (e) {
              currentToolUse.input = {}
            }
            toolUseBlocks.push(currentToolUse)
            currentToolUse = null
          }
        } else if (event.type === 'message_stop') {
          // Check if we need to handle tool use
          if (toolUseBlocks.length > 0) {
            res.write(`data: ${JSON.stringify({ type: 'tool_executing' })}\n\n`)

            // Execute tool calls
            const toolResults = await Promise.all(
              toolUseBlocks.map(async (toolUse) => {
                const result = await executeToolCall(toolUse.name, toolUse.input)
                res.write(`data: ${JSON.stringify({ type: 'tool_result', tool: toolUse.name, success: !result.error })}\n\n`)
                return {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(result, null, 2)
                }
              })
            )

            // Build content for assistant message
            const assistantContent = []
            if (fullResponse) {
              assistantContent.push({ type: 'text', text: fullResponse })
            }
            toolUseBlocks.forEach(tb => {
              assistantContent.push({
                type: 'tool_use',
                id: tb.id,
                name: tb.name,
                input: tb.input
              })
            })

            // Add to messages
            msgs.push({ role: 'assistant', content: assistantContent })
            msgs.push({ role: 'user', content: toolResults })

            // Reset for next iteration
            fullResponse = ''
            toolUseBlocks = []

            // Continue with tool results
            await streamResponse(msgs)
          }
        }
      }
    }

    await streamResponse(messages)

    // Save the complete response
    if (fullResponse) {
      saveChatMessage(analysisId, 'assistant', fullResponse)
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()

  } catch (error) {
    console.error('Stream error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`)
    res.end()
  }
})

// Non-streaming endpoint (kept for compatibility)
router.post('/', async (req, res) => {
  try {
    const { message, analysisId, context, history = [] } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Nachricht ist erforderlich' })
    }

    if (!analysisId) {
      return res.status(400).json({ error: 'Analyse-ID ist erforderlich' })
    }

    saveChatMessage(analysisId, 'user', message)

    const contextMessage = `
AKTUELLE ANALYSE-KONTEXT:
URL: ${context.url}
GEO-Score: ${context.geoScore}/100
Zusammenfassung: ${context.scoreSummary}

Staerken:
${context.strengths?.map(s => `- ${s.title}: ${s.description}`).join('\n') || 'Keine'}

Schwaechen:
${context.weaknesses?.map(w => `- [${w.priority}] ${w.title}: ${w.description}`).join('\n') || 'Keine'}

Empfehlungen:
${context.recommendations?.map(r => `- [${r.timeframe}] ${r.action}: ${r.reason}`).join('\n') || 'Keine'}

Du kannst jederzeit andere URLs abrufen, wenn der Nutzer danach fragt.
`

    const messages = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: 'Ich habe die GEO-Analyse verstanden und kann jederzeit weitere Webseiten abrufen. Wie kann ich dir helfen?' },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ]

    let response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: CHAT_SYSTEM_PROMPT,
      tools: tools,
      messages,
    })

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use')

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await executeToolCall(toolUse.name, toolUse.input)
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, null, 2)
          }
        })
      )

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await client.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        system: CHAT_SYSTEM_PROMPT,
        tools: tools,
        messages,
      })
    }

    const textBlocks = response.content.filter(block => block.type === 'text')
    const assistantMessage = textBlocks.map(block => block.text).join('\n')

    saveChatMessage(analysisId, 'assistant', assistantMessage)

    res.json({ response: assistantMessage })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: error.message || 'Chat fehlgeschlagen' })
  }
})

export default router
