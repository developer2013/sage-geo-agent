import { useState, useEffect } from 'react'
import axios from 'axios'
import { Header } from '@/components/Header'
import { UrlInput, type ImageSettings } from '@/components/UrlInput'
import { AnalysisResult } from '@/components/AnalysisResult'
import { HistoryPanel } from '@/components/HistoryPanel'
import { LoadingAnimation } from '@/components/LoadingAnimation'
import { ChatPanel } from '@/components/ChatPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult as AnalysisResultType, HistoryItem } from '@/types'

// Always use relative URLs - Vite proxy handles /api in dev mode
const API_URL = ''

interface ProgressState {
  step: number
  message: string
}

function App() {
  const { t, i18n } = useTranslation()
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResultType | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Load history on mount
    loadHistory()
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/history`)
      setHistory(response.data.analyses)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const translateError = (errorCode: string): string => {
    const key = `error.${errorCode}`
    const translated = t(key)
    // If no translation found (key returned as-is), return the raw message
    return translated === key ? errorCode : translated
  }

  const handleAnalyze = async (url: string, imageSettings: ImageSettings) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setProgress({ step: 0, message: t('app.startingAnalysis') })

    try {
      const response = await fetch(`${API_URL}/api/analyze/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, imageSettings, lang: i18n.language }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t('app.analysisFailed'))
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error(t('app.streamUnavailable'))
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'progress') {
                setProgress({ step: event.step, message: event.message })
              } else if (event.type === 'complete') {
                setResult(event.analysis)
                loadHistory()
                toast.success(t('app.analysisComplete'), {
                  description: t('app.geoScoreResult', { score: event.analysis.geoScore })
                })
              } else if (event.type === 'error') {
                throw new Error(event.error)
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // JSON parse error - skip this line
                continue
              }
              throw e
            }
          }
        }
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : t('app.unexpectedError')
      const errorMessage = translateError(rawMessage)
      setError(errorMessage)
      toast.error(t('app.analysisFailed'), { description: errorMessage })
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  const handleSelectHistoryItem = async (id: string) => {
    setIsHistoryOpen(false)
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/api/history/${id}`)
      setResult(response.data)
    } catch (err) {
      setError(t('app.couldNotLoadAnalysis'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/history/${id}`)
      loadHistory()
      if (result?.id === id) {
        setResult(null)
      }
    } catch (err) {
      console.error('Failed to delete history item:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onHistoryClick={() => setIsHistoryOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <div className="space-y-6">
          <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />

          {/* Loading Animation */}
          <LoadingAnimation isLoading={isLoading} progress={progress} />

          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-4">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              <AnalysisResult result={result} />
              <ChatPanel analysis={result} />
            </>
          )}

          {!result && !isLoading && !error && (
            <Card className="neu-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="neu-score p-1 mb-6">
                    <div className="neu-score-inner p-5">
                      <Sparkles className="h-10 w-10 text-primary animate-pulse-glow" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {t('app.readyTitle')}
                  </h3>
                  <p className="text-muted-foreground max-w-md leading-relaxed">
                    {t('app.readyDescription')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
      />

      <Toaster />
    </div>
  )
}

export default App
