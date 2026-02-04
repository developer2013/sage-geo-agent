import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Lightbulb, Code, BarChart3, Gauge, History, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { GeoScore } from './GeoScore'
import { StrengthsList } from './StrengthsList'
import { WeaknessesList } from './WeaknessesList'
import { Recommendations } from './Recommendations'
import { CodeViewer } from './CodeViewer'
import { ContentStatsCard } from './ContentStatsCard'
import { PerformanceMetricsCard } from './PerformanceMetricsCard'
import { CitationProbability } from './CitationProbability'
import { ExportButton } from './ExportButton'
import { VersionHistory } from './VersionHistory'
import { SerpTab } from './SerpTab'
import type { AnalysisResult as AnalysisResultType } from '@/types'

interface AnalysisResultProps {
  result: AnalysisResultType
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { t, i18n } = useTranslation()
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{t('analysis.result')}</h2>
          <p className="text-sm text-muted-foreground truncate">{result.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date(result.analyzedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="gap-1"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis.history')}</span>
          </Button>
          <ExportButton result={result} />
        </div>
      </div>

      <VersionHistory
        url={result.url}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <GeoScore score={result.geoScore} summary={result.scoreSummary} />

      <Tabs defaultValue="strengths" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-1">
          <TabsTrigger value="strengths" className="flex items-center gap-1 text-xs sm:text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis.tabStrengths')}</span>
            <span className="sm:hidden">{result.strengths.length}</span>
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex items-center gap-1 text-xs sm:text-sm">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis.tabWeaknesses')}</span>
            <span className="sm:hidden">{result.weaknesses.length}</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1 text-xs sm:text-sm">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis.tabRecommendations')}</span>
            <span className="sm:hidden">{result.recommendations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="serp" className="flex items-center gap-1 text-xs sm:text-sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SERP</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis.tabStats')}</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 text-xs sm:text-sm">
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-1 text-xs sm:text-sm">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Code</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strengths" className="mt-4">
          <StrengthsList strengths={result.strengths} />
        </TabsContent>

        <TabsContent value="weaknesses" className="mt-4">
          <WeaknessesList weaknesses={result.weaknesses} />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Recommendations
            recommendations={result.recommendations}
            nextStep={result.nextStep}
          />
        </TabsContent>

        <TabsContent value="serp" className="mt-4">
          {result.serpAnalysis ? (
            <SerpTab serpAnalysis={result.serpAnalysis} pageCode={result.pageCode} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('analysis.noSerpData')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          {result.contentStats ? (
            <>
              <ContentStatsCard stats={result.contentStats} />
              <CitationProbability result={result} />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('analysis.noStatsData')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {result.performanceMetrics ? (
            <PerformanceMetricsCard metrics={result.performanceMetrics} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {t('analysis.noPerformanceData')}
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <CodeViewer pageCode={result.pageCode} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
