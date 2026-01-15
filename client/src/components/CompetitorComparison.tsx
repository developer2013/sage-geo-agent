import { useState } from 'react'
import { Plus, X, Trophy, TrendingUp, TrendingDown, Loader2, BarChart3, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ComparisonRanking {
  rank: number
  url: string
  geoScore: number
  scoreSummary: string
  fromCache: boolean
  strengthCount: number
  weaknessCount: number
}

interface ComparisonResult {
  timestamp: string
  urlCount: number
  successCount: number
  failedCount: number
  rankings: ComparisonRanking[]
  statistics: {
    average: number
    highest: number
    lowest: number
    spread: number
  }
  winner: {
    url: string
    geoScore: number
    strengths: Array<{ title: string; description: string }>
    keyAdvantages: string
  }
  improvements: Array<{
    url: string
    geoScore: number
    scoreDiff: number
    missingStrengths: string[]
  }>
  commonWeaknesses: Array<{
    title: string
    priority: string
    affectedUrls: number
  }>
  failed: Array<{ url: string; error: string }>
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function CompetitorComparison() {
  const [urls, setUrls] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const addUrl = () => {
    if (urls.length < 5) {
      setUrls([...urls, ''])
    }
  }

  const removeUrl = (index: number) => {
    if (urls.length > 2) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const runComparison = async () => {
    const validUrls = urls.filter(u => u.trim() !== '')

    if (validUrls.length < 2) {
      setError('Mindestens 2 URLs erforderlich')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Vergleich fehlgeschlagen')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white"><Trophy className="h-3 w-3 mr-1" />1. Platz</Badge>
    if (rank === 2) return <Badge variant="secondary">2. Platz</Badge>
    if (rank === 3) return <Badge variant="outline">3. Platz</Badge>
    return <Badge variant="outline">{rank}. Platz</Badge>
  }

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Wettbewerbs-Vergleich
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Wettbewerbs-Vergleich
          </DialogTitle>
          <DialogDescription>
            Vergleiche bis zu 5 URLs und finde heraus, wer die beste GEO-Optimierung hat.
          </DialogDescription>
        </DialogHeader>

        {/* URL Input Section */}
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-medium">URLs zum Vergleich</h4>
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`URL ${index + 1} (z.B. example.com)`}
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                disabled={loading}
              />
              {urls.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUrl(index)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            {urls.length < 5 && (
              <Button variant="outline" size="sm" onClick={addUrl} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                URL hinzufuegen
              </Button>
            )}
            <Button onClick={runComparison} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analysiere...
                </>
              ) : (
                'Vergleich starten'
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg mt-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 mt-6">
            {/* Statistics Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Uebersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{result.statistics.highest}</div>
                    <div className="text-xs text-muted-foreground">Hoechster Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{result.statistics.average}</div>
                    <div className="text-xs text-muted-foreground">Durchschnitt</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{result.statistics.lowest}</div>
                    <div className="text-xs text-muted-foreground">Niedrigster Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{result.statistics.spread}</div>
                    <div className="text-xs text-muted-foreground">Spanne</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rankings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.rankings.map((ranking) => (
                  <div
                    key={ranking.url}
                    className={`p-3 rounded-lg border ${ranking.rank === 1 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRankBadge(ranking.rank)}
                        <span className="font-medium text-sm truncate max-w-[200px]">
                          {extractDomain(ranking.url)}
                        </span>
                        {ranking.fromCache && (
                          <Badge variant="outline" className="text-xs">Cache</Badge>
                        )}
                      </div>
                      <div className={`text-xl font-bold ${getScoreColor(ranking.geoScore)}`}>
                        {ranking.geoScore}
                      </div>
                    </div>
                    <Progress value={ranking.geoScore} className="h-2" />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{ranking.strengthCount} Staerken</span>
                      <span>{ranking.weaknessCount} Schwaechen</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What's Missing Section */}
            {result.improvements.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Was fehlt den anderen?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.improvements.map((imp) => (
                    <div key={imp.url} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{extractDomain(imp.url)}</span>
                        <Badge variant="outline" className="text-red-600">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          -{imp.scoreDiff} Punkte
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Fehlende Staerken:</span>
                        <ul className="list-disc list-inside mt-1">
                          {imp.missingStrengths.slice(0, 3).map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Common Weaknesses */}
            {result.commonWeaknesses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Gemeinsame Schwaechen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.commonWeaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{weakness.title}</span>
                        <Badge variant={weakness.priority === 'KRITISCH' ? 'destructive' : 'secondary'}>
                          {weakness.affectedUrls} von {result.successCount}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Failed URLs */}
            {result.failed.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-red-600">Fehlgeschlagen</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {result.failed.map((f, i) => (
                      <li key={i} className="text-muted-foreground">
                        {extractDomain(f.url)}: {f.error}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
