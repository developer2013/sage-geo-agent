import { Zap, Clock, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { Recommendation } from '@/types'

interface RecommendationsProps {
  recommendations: Recommendation[]
  nextStep: string
}

export function Recommendations({ recommendations, nextStep }: RecommendationsProps) {
  const getIcon = (timeframe: string) => {
    switch (timeframe) {
      case 'SOFORT':
        return <Zap className="h-4 w-4" />
      case 'KURZFRISTIG':
        return <Clock className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getBadgeClass = (timeframe: string) => {
    switch (timeframe) {
      case 'SOFORT':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'KURZFRISTIG':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }

  const groupedRecommendations = {
    SOFORT: recommendations.filter((r) => r.timeframe === 'SOFORT'),
    KURZFRISTIG: recommendations.filter((r) => r.timeframe === 'KURZFRISTIG'),
    MITTELFRISTIG: recommendations.filter((r) => r.timeframe === 'MITTELFRISTIG'),
  }

  return (
    <div className="space-y-4">
      {nextStep && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-primary">Naechster Schritt</h4>
                <p className="text-sm mt-1">{nextStep}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" defaultValue={['SOFORT']} className="w-full">
        {Object.entries(groupedRecommendations).map(([timeframe, recs]) => {
          if (recs.length === 0) return null
          return (
            <AccordionItem key={timeframe} value={timeframe}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge className={getBadgeClass(timeframe)}>
                    {getIcon(timeframe)}
                    <span className="ml-1">{timeframe}</span>
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    ({recs.length} {recs.length === 1 ? 'Empfehlung' : 'Empfehlungen'})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {recs.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <h5 className="font-medium">{rec.action}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.reason}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
