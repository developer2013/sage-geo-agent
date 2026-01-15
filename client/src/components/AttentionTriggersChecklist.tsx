import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Check, X } from 'lucide-react'
import type { AttentionTrigger } from '@/types'

interface AttentionTriggersChecklistProps {
  triggers: AttentionTrigger[]
}

export function AttentionTriggersChecklist({ triggers }: AttentionTriggersChecklistProps) {
  const foundCount = triggers.filter(t => t.found).length
  const totalCount = triggers.length

  const getLocationBadge = (location: AttentionTrigger['location']) => {
    switch (location) {
      case 'both':
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Title + Desc
          </span>
        )
      case 'title':
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Title
          </span>
        )
      case 'description':
        return (
          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            Description
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Attention Triggers
          </CardTitle>
          <span className={`text-sm font-medium ${foundCount >= 3 ? 'text-emerald-600' : foundCount >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
            {foundCount}/{totalCount} gefunden
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {triggers.map(trigger => (
            <div
              key={trigger.keyword}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                trigger.found
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
                  : 'bg-muted/30 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {trigger.found ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={trigger.found ? 'font-medium' : 'text-muted-foreground'}>
                  {trigger.keyword}
                </span>
              </div>
              {trigger.found && getLocationBadge(trigger.location)}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Attention Triggers sind Keywords die in B2B-SERPs haeufig geklickt werden.
          Je mehr Trigger in Title und Description vorkommen, desto hoeher die Click-Rate.
        </p>
      </CardContent>
    </Card>
  )
}
