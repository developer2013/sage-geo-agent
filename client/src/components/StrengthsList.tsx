import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Strength } from '@/types'

interface StrengthsListProps {
  strengths: Strength[]
}

export function StrengthsList({ strengths }: StrengthsListProps) {
  if (strengths.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Keine Staerken gefunden.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {strengths.map((strength, index) => (
        <Card key={index} className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-emerald-700 dark:text-emerald-400">
                  {strength.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {strength.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
