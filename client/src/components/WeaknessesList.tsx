import { XCircle, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import type { Weakness } from '@/types'

interface WeaknessesListProps {
  weaknesses: Weakness[]
}

export function WeaknessesList({ weaknesses }: WeaknessesListProps) {
  const { t } = useTranslation()

  if (weaknesses.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        {t('weaknesses.empty')}
      </p>
    )
  }

  const getIcon = (priority: string) => {
    switch (priority) {
      case 'KRITISCH':
        return <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      case 'MITTEL':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
    }
  }

  const getBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'KRITISCH':
        return 'destructive'
      case 'MITTEL':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const getCardStyle = (priority: string) => {
    switch (priority) {
      case 'KRITISCH':
        return 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
      case 'MITTEL':
        return 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
      default:
        return 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
    }
  }

  const sortedWeaknesses = [...weaknesses].sort((a, b) => {
    const priorityOrder = { KRITISCH: 0, MITTEL: 1, NIEDRIG: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="space-y-3">
      {sortedWeaknesses.map((weakness, index) => (
        <Card key={index} className={getCardStyle(weakness.priority)}>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              {getIcon(weakness.priority)}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getBadgeVariant(weakness.priority) as 'destructive' | 'warning' | 'secondary'}>
                    {t(`priority.${weakness.priority}`)}
                  </Badge>
                  <h4 className="font-medium">{weakness.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {weakness.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
