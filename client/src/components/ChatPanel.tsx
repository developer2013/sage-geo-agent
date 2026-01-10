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
  const scrollRef = useRef<HTMLDivElement>(null)

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
    'Wie kann ich den GEO-Score verbessern?',
    'Erklaere die wichtigsten Schwaechen',
    'Was sollte ich zuerst aendern?',
    'Wie optimiere ich fuer ChatGPT?',
  ]

  if (!isExpanded) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-4">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold">Mit Claude chatten</h3>
                <p className="text-sm text-muted-foreground">
                  Stelle Fragen zur Analyse und erhalte personalisierte Tipps
                </p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat mit Claude
          </CardTitle>
          <Button
            variant="ghost"
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
                  Stelle Fragen zu deiner GEO-Analyse. Claude hilft dir, die Ergebnisse zu verstehen und gibt personalisierte Tipps.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="text-left text-sm p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
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
                  <div className="p-2 rounded-full bg-primary/10 h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="p-2 rounded-full bg-muted h-fit">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 rounded-full bg-primary/10 h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Stelle eine Frage zur Analyse..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
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
