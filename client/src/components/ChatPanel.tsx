import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, Loader2, User, Bot, Sparkles } from 'lucide-react'
import { BrandSettings, defaultBrandSettings, type BrandSettingsState } from './BrandSettings'
import type { AnalysisResult } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface StreamEvent {
  type: 'text' | 'tool_start' | 'tool_executing' | 'tool_result' | 'done' | 'error'
  content?: string
  tool?: string
  success?: boolean
  error?: string
}

interface ChatPanelProps {
  analysis: AnalysisResult
}

export function ChatPanel({ analysis }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [brandSettings, setBrandSettings] = useState<BrandSettingsState>(defaultBrandSettings)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load chat history when analysis changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!analysis?.id) return

      setIsLoadingHistory(true)
      try {
        const response = await axios.get(`/api/chat/${analysis.id}`)
        if (response.data.messages && response.data.messages.length > 0) {
          setMessages(response.data.messages)
          setIsExpanded(true) // Auto-expand if there's chat history
        } else {
          setMessages([])
        }
      } catch (err) {
        console.error('Error loading chat history:', err)
        setMessages([])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadChatHistory()
  }, [analysis?.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    setStreamingContent('')
    setCurrentTool(null)

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          analysisId: analysis.id,
          context: {
            url: analysis.url,
            geoScore: analysis.geoScore,
            scoreSummary: analysis.scoreSummary,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
          },
          history: messages,
          brandSettings: brandSettings.useSageBrand ? brandSettings : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Stream request failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      if (!reader) {
        throw new Error('No reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6))

              if (event.type === 'text') {
                accumulatedContent += event.content || ''
                setStreamingContent(accumulatedContent)
              } else if (event.type === 'tool_start') {
                setCurrentTool(event.tool || null)
              } else if (event.type === 'tool_executing') {
                // Tool is being executed
              } else if (event.type === 'tool_result') {
                setCurrentTool(null)
              } else if (event.type === 'done') {
                if (accumulatedContent) {
                  setMessages(prev => [...prev, { role: 'assistant', content: accumulatedContent }])
                }
                setStreamingContent('')
              } else if (event.type === 'error') {
                setMessages(prev => [
                  ...prev,
                  { role: 'assistant', content: `Fehler: ${event.error}` },
                ])
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.' },
      ])
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      setCurrentTool(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Generate dynamic questions based on weaknesses and new tools
  const generateSuggestedQuestions = () => {
    const questions: string[] = []

    // Add questions based on critical weaknesses
    const criticalWeaknesses = analysis.weaknesses?.filter(w => w.priority === 'KRITISCH') || []

    if (criticalWeaknesses.length > 0) {
      const firstCritical = criticalWeaknesses[0]
      questions.push(`Wie behebe ich: ${firstCritical.title}?`)
    }

    // Check for specific issues and add relevant questions
    const hasNoSchema = analysis.weaknesses?.some(w =>
      w.title.toLowerCase().includes('schema') || w.description.toLowerCase().includes('schema')
    )
    if (hasNoSchema) {
      questions.push('Generiere Schema Markup für diese Seite')
    }

    const hasNoCTA = analysis.ctaAnalysis?.ctaQuality === 'SCHLECHT' || !analysis.ctaAnalysis?.primaryCta
    if (hasNoCTA) {
      questions.push('Wie gestalte ich bessere CTAs?')
    }

    // Try to extract domain/keyword for competitor search
    try {
      const domain = new URL(analysis.url).hostname.replace('www.', '')
      const domainParts = domain.split('.')
      if (domainParts.length > 1 && questions.length < 3) {
        questions.push(`Finde Konkurrenten für ${domainParts[0]}`)
      }
    } catch {
      // Fallback if URL parsing fails
      if (questions.length < 3) {
        questions.push('Finde meine Konkurrenten')
      }
    }

    // Add sitemap analysis suggestion
    if (questions.length < 4) {
      questions.push('Analysiere meine Sitemap')
    }

    // Ensure max 4 questions
    return questions.slice(0, 4)
  }

  const suggestedQuestions = generateSuggestedQuestions()

  if (!isExpanded) {
    return (
      <Card className="neu-card hover:shadow-[8px_8px_16px_var(--shadow-dark),-8px_-8px_16px_var(--shadow-light)] transition-all duration-300 cursor-pointer" onClick={() => setIsExpanded(true)}>
        <CardContent className="py-4">
          <div className="w-full flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="neu-icon">
                {isLoadingHistory ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-semibold">
                  Mit Claude chatten
                  {messages.length > 0 && (
                    <span className="ml-2 text-xs text-primary">
                      ({messages.length} Nachrichten)
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {messages.length > 0
                    ? 'Setze die Unterhaltung fort'
                    : 'Suche Konkurrenten, analysiere Sitemaps, generiere Schema Markup'}
                </p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="neu-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="neu-icon p-2">
              <MessageCircle className="h-4 w-4 text-primary" />
            </div>
            Chat mit Claude
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Minimieren
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[300px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Claude kann Webseiten abrufen, Konkurrenten suchen, Sitemaps analysieren und Schema Markup generieren.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="text-left text-sm p-3 rounded-xl bg-background shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)] transition-all duration-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="neu-icon p-2 h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)]'
                      : 'bg-background shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="neu-icon p-2 h-fit">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming response */}
            {(isLoading || streamingContent) && (
              <div className="flex gap-3">
                <div className="neu-icon p-2 h-fit animate-pulse">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[80%] bg-background p-3 rounded-xl shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]">
                  {currentTool && (
                    <div className="flex items-center gap-2 text-sm text-primary mb-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>
                        {currentTool === 'fetch_webpage' && 'Lade Webseite...'}
                        {currentTool === 'compare_pages' && 'Vergleiche 2 Seiten...'}
                        {currentTool === 'compare_multiple' && 'Vergleiche mehrere Seiten...'}
                        {currentTool === 'search_competitors' && 'Suche Konkurrenten...'}
                        {currentTool === 'generate_schema_markup' && 'Bereite Schema vor...'}
                        {currentTool === 'analyze_sitemap' && 'Analysiere Sitemap...'}
                        {!['fetch_webpage', 'compare_pages', 'compare_multiple', 'search_competitors', 'generate_schema_markup', 'analyze_sitemap'].includes(currentTool) && 'Verarbeite...'}
                      </span>
                    </div>
                  )}
                  {streamingContent ? (
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Brand Settings */}
        <BrandSettings settings={brandSettings} onChange={setBrandSettings} />

        {/* Input */}
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Stelle eine Frage zur Analyse..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
