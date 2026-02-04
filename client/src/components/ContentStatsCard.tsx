import { useTranslation } from 'react-i18next'
import {
  FileText,
  Image,
  Link2,
  ExternalLink,
  Heading,
  List,
  Table,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ContentStats } from '@/types'

interface ContentStatsCardProps {
  stats: ContentStats
}

export function ContentStatsCard({ stats }: ContentStatsCardProps) {
  const { t, i18n } = useTranslation()

  const statItems = [
    {
      icon: FileText,
      label: t('stats.words'),
      value: stats.wordCount.toLocaleString(i18n.language === 'en' ? 'en-US' : 'de-DE')
    },
    {
      icon: Clock,
      label: t('stats.readTime'),
      value: t('stats.readTimeValue', { minutes: stats.estimatedReadTime })
    },
    {
      icon: Image,
      label: t('stats.images'),
      value: stats.imageCount.toString(),
      subtext: t('stats.imagesWithAlt', { count: stats.imagesWithAlt })
    },
    {
      icon: Link2,
      label: t('stats.internalLinks'),
      value: stats.internalLinks.toString()
    },
    {
      icon: ExternalLink,
      label: t('stats.externalLinks'),
      value: stats.externalLinks.toString()
    },
    {
      icon: Heading,
      label: t('stats.headings'),
      value: Object.values(stats.headingStructure).reduce((a, b) => a + b, 0).toString()
    },
    {
      icon: List,
      label: t('stats.lists'),
      value: stats.listCount.toString()
    },
    {
      icon: Table,
      label: t('stats.tables'),
      value: stats.tableCount.toString()
    },
  ]

  return (
    <Card className="neu-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="neu-icon p-2">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          {t('stats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 rounded-xl bg-background
                         shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]"
            >
              <item.icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-lg font-bold">{item.value}</span>
              <span className="text-xs text-muted-foreground text-center">{item.label}</span>
              {item.subtext && (
                <span className="text-xs text-muted-foreground/70">{item.subtext}</span>
              )}
            </div>
          ))}
        </div>

        {/* Heading Structure Visualization */}
        <div className="p-3 rounded-xl bg-background shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Heading className="h-4 w-4 text-primary" />
            {t('stats.headingStructure')}
          </h4>
          <div className="flex gap-2">
            {Object.entries(stats.headingStructure).map(([level, count]) => (
              <div key={level} className="flex-1 text-center">
                <div
                  className="rounded-lg bg-primary/10 flex items-center justify-center transition-all"
                  style={{
                    height: `${Math.max(24, Math.min(count * 12, 60))}px`
                  }}
                >
                  <span className="text-sm font-bold text-primary">{count}</span>
                </div>
                <span className="text-xs text-muted-foreground uppercase mt-1 block">
                  {level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
