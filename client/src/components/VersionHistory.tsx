import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { History, TrendingUp, TrendingDown, Minus, ArrowRight, Calendar, CheckCircle2, XCircle, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface VersionHistoryItem {
  id: string
  url: string
  geoScore: number
  scoreSummary: string
  strengths: Array<{ title: string; description: string }>
  weaknesses: Array<{ title: string; description: string }>
  recommendations: Array<{ action: string; reason: string }>
  analyzedAt: string
  version: number
}

interface VersionHistoryResponse {
  url: string
  versionCount: number
  versions: VersionHistoryItem[]
  trend: {
    latest: number
    previous: number
    oldest: number
    recentChange: number
    totalChange: number
    improving: boolean
  }
}

interface ComparisonResult {
  oldAnalysis: {
    id: string
    geoScore: number
    analyzedAt: string
    strengthCount: number
    weaknessCount: number
  }
  newAnalysis: {
    id: string
    geoScore: number
    analyzedAt: string
    strengthCount: number
    weaknessCount: number
  }
  changes: {
    scoreDiff: number
    scoreImproved: boolean
    newStrengths: Array<{ title: string; description: string }>
    removedStrengths: Array<{ title: string; description: string }>
    fixedWeaknesses: Array<{ title: string; description: string }>
    newWeaknesses: Array<{ title: string; description: string }>
    summary: string
  }
}

interface VersionHistoryProps {
  url: string
  isOpen: boolean
  onClose: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function VersionHistory({ url, isOpen, onClose }: VersionHistoryProps) {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<VersionHistoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Comparison state
  const [compareMode, setCompareMode] = useState(false)
  const [oldVersionId, setOldVersionId] = useState<string>('')
  const [newVersionId, setNewVersionId] = useState<string>('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)

  useEffect(() => {
    if (isOpen && url) {
      loadHistory()
    }
  }, [isOpen, url])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    setHistory(null)
    setComparison(null)
    setCompareMode(false)

    try {
      const encodedUrl = encodeURIComponent(url)
      const response = await fetch(`${API_BASE}/api/history/url/${encodedUrl}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('version.noHistoryFound'))
        }
        throw new Error(t('version.loadError'))
      }

      const data = await response.json()
      setHistory(data)

      // Pre-select versions for comparison if we have at least 2
      if (data.versions.length >= 2) {
        setNewVersionId(data.versions[0].id)
        setOldVersionId(data.versions[1].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.unknown_error'))
    } finally {
      setLoading(false)
    }
  }

  const runComparison = async () => {
    if (!oldVersionId || !newVersionId) return

    setCompareLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/history/compare/${oldVersionId}/${newVersionId}`)

      if (!response.ok) {
        throw new Error(t('version.comparisonFailed'))
      }

      const data = await response.json()
      setComparison(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('version.comparisonFailed'))
    } finally {
      setCompareLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendBadge = (change: number) => {
    if (change > 0) {
      return <Badge className="bg-green-500 text-white">+{change} {t('common.points')}</Badge>
    }
    if (change < 0) {
      return <Badge variant="destructive">{change} {t('common.points')}</Badge>
    }
    return <Badge variant="secondary">{t('version.unchanged')}</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('version.title')}
          </DialogTitle>
          <DialogDescription className="truncate max-w-[500px]">
            {url}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {history && (
          <div className="space-y-6">
            {/* Trend Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('version.scoreDevelopment')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{t('version.firstAnalysis')}</div>
                    <div className={`text-2xl font-bold ${getScoreColor(history.trend.oldest)}`}>
                      {history.trend.oldest}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-2 px-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="text-center">
                      {getTrendIcon(history.trend.totalChange)}
                      <div className="text-sm font-medium mt-1">
                        {history.trend.totalChange > 0 ? '+' : ''}{history.trend.totalChange}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{t('version.currentAnalysis')}</div>
                    <div className={`text-2xl font-bold ${getScoreColor(history.trend.latest)}`}>
                      {history.trend.latest}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  {history.trend.improving ? (
                    <Badge className="bg-green-500 text-white">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {t('version.positiveTrend')}
                    </Badge>
                  ) : history.trend.totalChange < 0 ? (
                    <Badge variant="destructive">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {t('version.negativeTrend')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Minus className="h-3 w-3 mr-1" />
                      {t('version.stable')}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground ml-2">
                    {t('version.overAnalyses', { count: history.versionCount })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Version List */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t('version.allVersions')}</CardTitle>
                  {history.versions.length >= 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareMode(!compareMode)}
                    >
                      {compareMode ? t('version.endComparison') : t('version.compareVersions')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border ${index === 0 ? 'border-primary/50 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          V{version.version}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.analyzedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index < history.versions.length - 1 && (
                          getTrendBadge(version.geoScore - history.versions[index + 1].geoScore)
                        )}
                        <span className={`text-xl font-bold ${getScoreColor(version.geoScore)}`}>
                          {version.geoScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{version.strengths?.length || 0} {t('common.strengths')}</span>
                      <span>{version.weaknesses?.length || 0} {t('common.weaknesses')}</span>
                      <span>{version.recommendations?.length || 0} {t('common.recommendations')}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comparison Section */}
            {compareMode && history.versions.length >= 2 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t('version.compareVersions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('version.olderVersion')}</label>
                      <Select value={oldVersionId} onValueChange={setOldVersionId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('version.selectVersion')} />
                        </SelectTrigger>
                        <SelectContent>
                          {history.versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              V{v.version} - {formatDate(v.analyzedAt)} ({v.geoScore})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('version.newerVersion')}</label>
                      <Select value={newVersionId} onValueChange={setNewVersionId}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('version.selectVersion')} />
                        </SelectTrigger>
                        <SelectContent>
                          {history.versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              V{v.version} - {formatDate(v.analyzedAt)} ({v.geoScore})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={runComparison}
                    disabled={compareLoading || !oldVersionId || !newVersionId || oldVersionId === newVersionId}
                    className="w-full"
                  >
                    {compareLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('version.comparing')}
                      </>
                    ) : (
                      t('version.startComparison')
                    )}
                  </Button>

                  {/* Comparison Results */}
                  {comparison && (
                    <div className="space-y-4 pt-4 border-t">
                      {/* Score Change */}
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-lg font-medium mb-2">{comparison.changes.summary}</div>
                        <div className="flex items-center justify-center gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">{t('version.before')}</div>
                            <div className={`text-2xl font-bold ${getScoreColor(comparison.oldAnalysis.geoScore)}`}>
                              {comparison.oldAnalysis.geoScore}
                            </div>
                          </div>
                          <ArrowRight className="h-6 w-6" />
                          <div>
                            <div className="text-sm text-muted-foreground">{t('version.after')}</div>
                            <div className={`text-2xl font-bold ${getScoreColor(comparison.newAnalysis.geoScore)}`}>
                              {comparison.newAnalysis.geoScore}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fixed Weaknesses */}
                      {comparison.changes.fixedWeaknesses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            {t('version.fixedWeaknesses')} ({comparison.changes.fixedWeaknesses.length})
                          </h4>
                          <ul className="space-y-1">
                            {comparison.changes.fixedWeaknesses.map((w, i) => (
                              <li key={i} className="text-sm p-2 rounded bg-green-50 dark:bg-green-900/20">
                                {w.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* New Strengths */}
                      {comparison.changes.newStrengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-blue-600">
                            <Plus className="h-4 w-4" />
                            {t('version.newStrengths')} ({comparison.changes.newStrengths.length})
                          </h4>
                          <ul className="space-y-1">
                            {comparison.changes.newStrengths.map((s, i) => (
                              <li key={i} className="text-sm p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                                {s.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* New Weaknesses (negative) */}
                      {comparison.changes.newWeaknesses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            {t('version.newWeaknesses')} ({comparison.changes.newWeaknesses.length})
                          </h4>
                          <ul className="space-y-1">
                            {comparison.changes.newWeaknesses.map((w, i) => (
                              <li key={i} className="text-sm p-2 rounded bg-red-50 dark:bg-red-900/20">
                                {w.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Removed Strengths (negative) */}
                      {comparison.changes.removedStrengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2 text-amber-600">
                            <XCircle className="h-4 w-4" />
                            {t('version.lostStrengths')} ({comparison.changes.removedStrengths.length})
                          </h4>
                          <ul className="space-y-1">
                            {comparison.changes.removedStrengths.map((s, i) => (
                              <li key={i} className="text-sm p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                                {s.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* No changes */}
                      {comparison.changes.fixedWeaknesses.length === 0 &&
                       comparison.changes.newStrengths.length === 0 &&
                       comparison.changes.newWeaknesses.length === 0 &&
                       comparison.changes.removedStrengths.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          {t('version.noSignificantChanges')}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
