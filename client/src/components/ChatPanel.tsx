import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, Loader2, User, Bot, Sparkles } from 'lucide-react'
import type { AnalysisResult } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
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
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await axios.post('/api/chat', {
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
      })

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    'Wie kann ich den Score verbessern?',
    'Vergleiche mit einem Konkurrenten',
    'Schau dir example.com an',
    'Was macht die Konkurrenz besser?',
  ]

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
                    : 'Frag nach URLs, vergleiche Seiten, erhalte GEO-Tipps'}
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
                  Claude kann beliebige Webseiten abrufen und analysieren. Frag nach URLs, vergleiche Konkurrenten, oder lass dir GEO-Tipps geben.
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

            {isLoading && (
              <div className="flex gap-3">
                <div className="neu-icon p-2 h-fit animate-pulse">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-background p-3 rounded-xl shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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
