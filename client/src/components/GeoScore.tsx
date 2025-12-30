import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GeoScoreProps {
  score: number
  summary: string
}

export function GeoScore({ score, summary }: GeoScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/5'
    if (score >= 60) return 'from-amber-500/20 to-amber-500/5'
    if (score >= 40) return 'from-orange-500/20 to-orange-500/5'
    return 'from-red-500/20 to-red-500/5'
  }

  const getScoreRing = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500'
    if (score >= 60) return 'stroke-amber-500'
    if (score >= 40) return 'stroke-orange-500'
    return 'stroke-red-500'
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <Card className={`bg-gradient-to-br ${getScoreBackground(score)}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">GEO-Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="56"
                cy="56"
                r="45"
                strokeWidth="8"
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
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
