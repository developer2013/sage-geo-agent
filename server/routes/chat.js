import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { saveChatMessage, getChatMessages } from '../services/dbService.js'
import { scrapeWithFirecrawl, isFirecrawlAvailable, searchWithFirecrawl, fetchSitemap } from '../services/firecrawlService.js'
import { getBrandPromptAddition } from '../services/prompts/brandPrompt.js'
import { getBrandPromptAdditionEn } from '../services/prompts/brandPromptEn.js'
import { CHAT_SYSTEM_PROMPT_DE, TOOLS_DE } from '../services/prompts/chatPromptDe.js'
import { CHAT_SYSTEM_PROMPT_EN, TOOLS_EN } from '../services/prompts/chatPromptEn.js'

const router = express.Router()

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

  if (toolName === 'compare_multiple') {
    try {
      const urls = toolInput.urls?.slice(0, 5) || []
      if (urls.length < 2) {
        return { error: 'Mindestens 2 URLs zum Vergleich erforderlich' }
      }

      console.log(`[Chat] Comparing ${urls.length} pages`)

      const results = await Promise.all(
        urls.map(url => executeToolCall('fetch_webpage', { url }))
      )

      const comparison = results.map((result, index) => ({
        url: urls[index],
        title: result.title || 'Unbekannt',
        content: result.content?.substring(0, 3000) || '',
        hasError: !!result.error,
        error: result.error
      }))

      const successCount = comparison.filter(c => !c.hasError).length

      return {
        comparison,
        total: urls.length,
        successful: successCount,
        success: successCount > 0
      }
    } catch (error) {
      return { error: `Multi-Vergleich fehlgeschlagen: ${error.message}` }
    }
  }

  if (toolName === 'search_competitors') {
    try {
      if (!isFirecrawlAvailable()) {
        return { error: 'Firecrawl ist nicht konfiguriert. Websuche nicht verfügbar.' }
      }

      const query = toolInput.query
      const limit = Math.min(toolInput.limit || 5, 10)

      console.log(`[Chat] Searching for: "${query}" (limit: ${limit})`)

      const results = await searchWithFirecrawl(query, limit)

      return {
        query,
        results,
        count: results.length,
        success: true
      }
    } catch (error) {
      console.error(`[Chat] Search error:`, error.message)
      return { error: `Suche fehlgeschlagen: ${error.message}` }
    }
  }

  if (toolName === 'generate_schema_markup') {
    try {
      // If URL provided, fetch the page content
      if (toolInput.url) {
        const pageResult = await executeToolCall('fetch_webpage', { url: toolInput.url })

        if (pageResult.error) {
          return { error: pageResult.error }
        }

        return {
          url: toolInput.url,
          title: pageResult.title,
          description: pageResult.description,
          content: pageResult.content?.substring(0, 5000),
          requested_schema_type: toolInput.schema_type || 'auto',
          instruction: 'Basierend auf diesem Inhalt, generiere passendes JSON-LD Schema Markup. Berücksichtige den Schema-Typ falls angegeben.',
          success: true
        }
      }

      // No URL - use context from current analysis
      return {
        use_current_analysis: true,
        requested_schema_type: toolInput.schema_type || 'auto',
        instruction: 'Generiere JSON-LD Schema Markup basierend auf der aktuellen Analyse im Kontext.',
        success: true
      }
    } catch (error) {
      return { error: `Schema-Generierung vorbereitung fehlgeschlagen: ${error.message}` }
    }
  }

  if (toolName === 'analyze_sitemap') {
    try {
      if (!isFirecrawlAvailable()) {
        return { error: 'Firecrawl ist nicht konfiguriert. Sitemap-Analyse nicht verfügbar.' }
      }

      const limit = Math.min(toolInput.limit || 5, 10)
      const filter = toolInput.filter || ''

      console.log(`[Chat] Analyzing sitemap for: ${toolInput.url} (limit: ${limit}, filter: "${filter}")`)

      const sitemapResult = await fetchSitemap(toolInput.url)

      if (!sitemapResult.success || sitemapResult.urls.length === 0) {
        return { error: 'Konnte keine URLs in der Sitemap finden' }
      }

      // Filter URLs if filter is provided
      let urlsToAnalyze = sitemapResult.urls
      if (filter) {
        urlsToAnalyze = urlsToAnalyze.filter(url => url.includes(filter))
      }

      // Limit URLs
      urlsToAnalyze = urlsToAnalyze.slice(0, limit)

      console.log(`[Chat] Analyzing ${urlsToAnalyze.length} URLs from sitemap`)

      // Analyze each URL
      const results = await Promise.all(
        urlsToAnalyze.map(async (url) => {
          try {
            const pageResult = await executeToolCall('fetch_webpage', { url })
            return {
              url,
              title: pageResult.title || 'Unbekannt',
              hasContent: !pageResult.error && !!pageResult.content,
              contentPreview: pageResult.content?.substring(0, 500) || '',
              error: pageResult.error
            }
          } catch (err) {
            return { url, error: err.message }
          }
        })
      )

      const successfulPages = results.filter(r => r.hasContent)

      return {
        sitemap_url: sitemapResult.sitemapUrl,
        total_urls_in_sitemap: sitemapResult.urls.length,
        analyzed_count: urlsToAnalyze.length,
        successful_count: successfulPages.length,
        filter_used: filter || null,
        results,
        success: successfulPages.length > 0
      }
    } catch (error) {
      console.error(`[Chat] Sitemap analysis error:`, error.message)
      return { error: `Sitemap-Analyse fehlgeschlagen: ${error.message}` }
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
    res.status(500).json({ error: 'CHAT_FAILED' })
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
    const { message, analysisId, context, history = [], brandSettings, lang = 'de' } = req.body

    if (!message || !analysisId) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'MESSAGE_REQUIRED' })}\n\n`)
      res.end()
      return
    }

    // Save user message (may fail if analysis doesn't exist, but continue anyway)
    const saved = saveChatMessage(analysisId, 'user', message)
    if (!saved) {
      console.log(`[Chat] Could not save user message for analysis ${analysisId} - continuing without persistence`)
    }

    // Get brand prompt addition if enabled (language-aware)
    const brandPrompt = lang === 'en'
      ? getBrandPromptAdditionEn(brandSettings)
      : getBrandPromptAddition(brandSettings)

    // Select language-specific prompts and tools
    const chatSystemPrompt = lang === 'en' ? CHAT_SYSTEM_PROMPT_EN : CHAT_SYSTEM_PROMPT_DE
    const chatTools = lang === 'en' ? TOOLS_EN : TOOLS_DE

    // Build context message
    const isEn = lang === 'en'
    const contextMessage = isEn ? `
CURRENT ANALYSIS CONTEXT:
URL: ${context.url}
GEO Score: ${context.geoScore}/100
Summary: ${context.scoreSummary}

Strengths:
${context.strengths?.map(s => `- ${s.title}: ${s.description}`).join('\n') || 'None'}

Weaknesses:
${context.weaknesses?.map(w => `- [${w.priority}] ${w.title}: ${w.description}`).join('\n') || 'None'}

Recommendations:
${context.recommendations?.map(r => `- [${r.timeframe}] ${r.action}: ${r.reason}`).join('\n') || 'None'}

You can fetch other URLs at any time if the user asks.
` : `
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
    const assistantAck = isEn
      ? 'I understand the GEO analysis and can fetch additional websites at any time. How can I help you?'
      : 'Ich habe die GEO-Analyse verstanden und kann jederzeit weitere Webseiten abrufen. Wie kann ich dir helfen?'

    const messages = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: assistantAck },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ]

    let fullResponse = ''
    let toolUseBlocks = []
    let currentToolUse = null

    // Build system prompt with optional brand context
    const systemPrompt = brandPrompt
      ? `${chatSystemPrompt}\n\n${brandPrompt}`
      : chatSystemPrompt

    // Recursive function to handle streaming with tool use
    async function streamResponse(msgs) {
      const stream = await client.messages.stream({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 4096,
        system: systemPrompt,
        tools: chatTools,
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
    const { message, analysisId, context, history = [], lang = 'de' } = req.body

    if (!message) {
      return res.status(400).json({ error: 'MESSAGE_REQUIRED' })
    }

    if (!analysisId) {
      return res.status(400).json({ error: 'MESSAGE_REQUIRED' })
    }

    saveChatMessage(analysisId, 'user', message)

    // Select language-specific prompts and tools
    const nonStreamChatPrompt = lang === 'en' ? CHAT_SYSTEM_PROMPT_EN : CHAT_SYSTEM_PROMPT_DE
    const nonStreamChatTools = lang === 'en' ? TOOLS_EN : TOOLS_DE

    const isEn = lang === 'en'
    const contextMessage = isEn ? `
CURRENT ANALYSIS CONTEXT:
URL: ${context.url}
GEO Score: ${context.geoScore}/100
Summary: ${context.scoreSummary}

Strengths:
${context.strengths?.map(s => `- ${s.title}: ${s.description}`).join('\n') || 'None'}

Weaknesses:
${context.weaknesses?.map(w => `- [${w.priority}] ${w.title}: ${w.description}`).join('\n') || 'None'}

Recommendations:
${context.recommendations?.map(r => `- [${r.timeframe}] ${r.action}: ${r.reason}`).join('\n') || 'None'}

You can fetch other URLs at any time if the user asks.
` : `
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

    const assistantAck = isEn
      ? 'I understand the GEO analysis and can fetch additional websites at any time. How can I help you?'
      : 'Ich habe die GEO-Analyse verstanden und kann jederzeit weitere Webseiten abrufen. Wie kann ich dir helfen?'

    const messages = [
      { role: 'user', content: contextMessage },
      { role: 'assistant', content: assistantAck },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ]

    let response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: nonStreamChatPrompt,
      tools: nonStreamChatTools,
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
        system: nonStreamChatPrompt,
        tools: nonStreamChatTools,
        messages,
      })
    }

    const textBlocks = response.content.filter(block => block.type === 'text')
    const assistantMessage = textBlocks.map(block => block.text).join('\n')

    saveChatMessage(analysisId, 'assistant', assistantMessage)

    res.json({ response: assistantMessage })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'CHAT_FAILED' })
  }
})

export default router
