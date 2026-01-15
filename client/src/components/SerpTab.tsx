import { SerpPreviewCard } from './SerpPreviewCard'
import { ClickWorthinessScore } from './ClickWorthinessScore'
import { AttentionTriggersChecklist } from './AttentionTriggersChecklist'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, TrendingUp, Lightbulb } from 'lucide-react'
import type { SerpAnalysis, PageCode } from '@/types'

interface SerpTabProps {
  serpAnalysis: SerpAnalysis
  pageCode: PageCode
}

export function SerpTab({ serpAnalysis }: SerpTabProps) {
  const { recommendations } = serpAnalysis

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HOCH':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'MITTEL':
        return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HOCH':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'MITTEL':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* SERP Preview */}
      <SerpPreviewCard
        preview={serpAnalysis.serpPreview}
        attentionTriggers={serpAnalysis.attentionTriggers}
      />

      {/* Click-Worthiness Score with Metrics */}
      <ClickWorthinessScore
        score={serpAnalysis.clickWorthinessScore}
        metrics={serpAnalysis.metrics}
      />

      {/* Attention Triggers Checklist */}
      <AttentionTriggersChecklist triggers={serpAnalysis.attentionTriggers} />

      {/* SERP Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">SERP Optimierungen</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${getPriorityColor(rec.priority)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityBadge(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{rec.action}</p>
                      {rec.currentValue && rec.suggestedValue && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{rec.currentValue}</span>
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-emerald-600 font-medium">{rec.suggestedValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 text-sm">
        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Was ist Click-Worthiness?</p>
          <p>
            Der Click-Worthiness Score misst, wie wahrscheinlich Nutzer auf Ihr Suchergebnis klicken.
            Er basiert auf Best Practices fuer Title Tags, Meta Descriptions und psychologischen Triggern,
            die in B2B-Suchanfragen nachweislich zu hoeheren Klickraten fuehren.
          </p>
        </div>
      </div>
    </div>
  )
}
