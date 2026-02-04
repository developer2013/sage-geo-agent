import { useTranslation } from 'react-i18next'
import { Zap, Clock, Calendar, TrendingUp, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { FeedbackButtons } from './FeedbackButtons'
import type { Recommendation } from '@/types'

interface RecommendationsProps {
  recommendations: Recommendation[]
  nextStep: string
}

export function Recommendations({ recommendations, nextStep }: RecommendationsProps) {
  const { t } = useTranslation()

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

  const getImpactBadgeClass = (level?: string) => {
    switch (level) {
      case 'HOCH':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200'
      case 'MITTEL':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200'
      case 'NIEDRIG':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400'
    }
  }

  const getImpactStars = (level?: string) => {
    switch (level) {
      case 'HOCH':
        return 3
      case 'MITTEL':
        return 2
      case 'NIEDRIG':
        return 1
      default:
        return 0
    }
  }

  // Generate a stable recommendation type ID from the action text
  const getRecommendationType = (action: string): string => {
    return action
      .toLowerCase()
      .replace(/[äöü]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[match] || match))
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50)
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
                <h4 className="font-semibold text-primary">{t('recommendations.nextStep')}</h4>
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
                    <span className="ml-1">{t(`timeframe.${timeframe}`)}</span>
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    ({recs.length} {recs.length === 1 ? t('recommendations.recommendation') : t('recommendations.recommendations_plural')})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {recs.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-medium flex-1">{rec.action}</h5>
                          {rec.impact && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className={`${getImpactBadgeClass(rec.impact.level)} flex items-center gap-1 shrink-0`}
                                  >
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{rec.impact.percentage}</span>
                                    <span className="flex">
                                      {Array.from({ length: getImpactStars(rec.impact.level) }).map((_, i) => (
                                        <Star key={i} className="h-3 w-3 fill-current" />
                                      ))}
                                    </span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="font-medium">Impact: {t(`impact.${rec.impact.level}`)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t('recommendations.source')}: {rec.impact.source}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.reason}
                        </p>
                        <FeedbackButtons
                          recommendationType={getRecommendationType(rec.action)}
                        />
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
