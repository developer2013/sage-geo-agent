import { useTranslation } from 'react-i18next'
import { Gauge, Zap, LayoutGrid, HardDrive, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PerformanceMetrics } from '@/types'

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics
}

export function PerformanceMetricsCard({ metrics }: PerformanceMetricsCardProps) {
  const { t } = useTranslation()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fast':
      case 'good':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300'
      case 'moderate':
      case 'needs-improvement':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300'
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fast':
      case 'good':
        return t('performance.statusGood')
      case 'moderate':
      case 'needs-improvement':
        return t('performance.statusModerate')
      default:
        return t('performance.statusSlow')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="neu-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="neu-icon p-2">
            <Gauge className="h-4 w-4 text-primary" />
          </div>
          {t('performance.title')}
          <Badge variant="outline" className="ml-2 text-xs">
            {t('performance.estimated')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Core Web Vitals Estimates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-background shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]">
            <Zap className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground mb-1">{t('performance.lcpLabel')}</div>
            <Badge className={`${getStatusColor(metrics.estimatedLCP)} border`}>
              {getStatusLabel(metrics.estimatedLCP)}
            </Badge>
          </div>
          <div className="text-center p-3 rounded-xl bg-background shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]">
            <LayoutGrid className="h-5 w-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground mb-1">{t('performance.clsLabel')}</div>
            <Badge className={`${getStatusColor(metrics.estimatedCLS)} border`}>
              {getStatusLabel(metrics.estimatedCLS)}
            </Badge>
          </div>
        </div>

        {/* Content Size */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-background shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)] mb-4">
          <HardDrive className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{t('performance.estimatedPageSize')}</div>
            <div className="text-xs text-muted-foreground">
              HTML: {formatBytes(metrics.contentSize.html)} |
              Bilder: ~{formatBytes(metrics.contentSize.images)} |
              Gesamt: ~{formatBytes(metrics.contentSize.total)}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {metrics.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('performance.optimizationSuggestions')}
            </h4>
            <div className="space-y-1">
              {metrics.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {metrics.suggestions.length === 0 && (
          <div className="text-sm text-muted-foreground text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
            {t('performance.noIssues')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
