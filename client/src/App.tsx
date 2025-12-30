import { useState, useEffect } from 'react'
import axios from 'axios'
import { Header } from '@/components/Header'
import { UrlInput } from '@/components/UrlInput'
import { AnalysisResult } from '@/components/AnalysisResult'
import { HistoryPanel } from '@/components/HistoryPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import type { AnalysisResult as AnalysisResultType, HistoryItem } from '@/types'

// Use relative URLs in production, configured URL in development
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || '')

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

  const handleAnalyze = async (url: string) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post(`${API_URL}/api/analyze`, { url })
      setResult(response.data)
      loadHistory() // Refresh history after analysis
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Analyse fehlgeschlagen. Bitte versuche es erneut.')
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.')
      }
    } finally {
      setIsLoading(false)
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
      setError('Konnte Analyse nicht laden.')
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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />

          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-4">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && <AnalysisResult result={result} />}

          {!result && !isLoading && !error && (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Bereit zur Analyse
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Gib oben eine URL ein, um die GEO-Tauglichkeit deiner Webseite
                    zu analysieren. Du erhaeltst einen detaillierten Bericht mit
                    Staerken, Schwaechen und konkreten Handlungsempfehlungen.
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
    </div>
  )
}

export default App
