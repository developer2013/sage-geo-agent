import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Globe } from 'lucide-react'
import type { SerpAnalysis, AttentionTrigger } from '@/types'

interface SerpPreviewCardProps {
  preview: SerpAnalysis['serpPreview']
  attentionTriggers: AttentionTrigger[]
}

export function SerpPreviewCard({ preview, attentionTriggers }: SerpPreviewCardProps) {
  const { t } = useTranslation()
  const foundTriggers = attentionTriggers.filter(t => t.found)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('serp.googlePreview')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google-style SERP Preview */}
        <div className="rounded-lg border bg-white dark:bg-zinc-900 p-4 space-y-1">
          {/* Breadcrumb URL */}
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
              <Globe className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
            <span className="text-zinc-700 dark:text-zinc-400 truncate">
              {preview.displayUrl}
            </span>
          </div>

          {/* Title */}
          <div className="group">
            <h3 className="text-lg text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer leading-tight">
              {preview.truncatedTitle ? (
                <>
                  {preview.title.slice(0, 57)}...
                </>
              ) : (
                preview.title
              )}
            </h3>
            {preview.truncatedTitle && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                {t('serp.titleTruncated')}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {preview.truncatedDescription ? (
                <>
                  {preview.description.slice(0, 157)}...
                </>
              ) : (
                preview.description
              )}
            </p>
            {preview.truncatedDescription && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
                {t('serp.descriptionTruncated')}
              </div>
            )}
          </div>
        </div>

        {/* Found Attention Triggers */}
        {foundTriggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-muted-foreground">Attention Triggers:</span>
            {foundTriggers.map(trigger => (
              <span
                key={trigger.keyword}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {trigger.keyword}
                <span className="ml-1 text-emerald-500/70">
                  ({trigger.location === 'both' ? 'Title + Desc' : trigger.location === 'title' ? 'Title' : 'Desc'})
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Character counts */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className={preview.title.length > 60 ? 'text-amber-600' : preview.title.length < 30 ? 'text-amber-600' : 'text-emerald-600'}>
            {t('serp.titleChars', { count: preview.title.length })}
          </span>
          <span className={preview.description.length > 160 ? 'text-amber-600' : preview.description.length < 120 ? 'text-amber-600' : 'text-emerald-600'}>
            {t('serp.descriptionChars', { count: preview.description.length })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
