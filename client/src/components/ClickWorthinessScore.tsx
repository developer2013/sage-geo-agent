import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MousePointerClick } from 'lucide-react'
import type { SerpAnalysis } from '@/types'

interface ClickWorthinessScoreProps {
  score: number
  metrics: SerpAnalysis['metrics']
}

export function ClickWorthinessScore({ score, metrics }: ClickWorthinessScoreProps) {
  const { t } = useTranslation()

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 70) return 'from-emerald-500/20 to-emerald-500/5'
    if (score >= 40) return 'from-amber-500/20 to-amber-500/5'
    return 'from-red-500/20 to-red-500/5'
  }

  const getScoreRing = (score: number) => {
    if (score >= 70) return 'stroke-emerald-500'
    if (score >= 40) return 'stroke-amber-500'
    return 'stroke-red-500'
  }

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  const metricsList = [
    { key: 'titleQuality', label: t('serp.titleQuality'), metric: metrics.titleQuality },
    { key: 'descriptionQuality', label: t('serp.descriptionQuality'), metric: metrics.descriptionQuality },
    { key: 'b2bSignals', label: t('serp.b2bSignals'), metric: metrics.b2bSignals },
    { key: 'trustTriggers', label: t('serp.trustTriggers'), metric: metrics.trustTriggers },
    { key: 'featureClarity', label: 'Feature Clarity', metric: metrics.featureClarity },
    { key: 'videoContent', label: 'Video Content', metric: metrics.videoContent },
  ]

  return (
    <Card className={`bg-gradient-to-br ${getScoreBackground(score)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MousePointerClick className="h-5 w-5" />
          Click-Worthiness Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* Radial Score */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className={getScoreRing(score)}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>
          </div>

          {/* Metrics Bars */}
          <div className="flex-1 space-y-2">
            {metricsList.map(({ key, label, metric }) => (
              <div key={key} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-medium ${getScoreColor(metric.score)}`}>
                    {metric.label}
                  </span>
                </div>
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(metric.score)}`}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
