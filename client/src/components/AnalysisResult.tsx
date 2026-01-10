import { CheckCircle, XCircle, Lightbulb, Code, BarChart3, Gauge } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeoScore } from './GeoScore'
import { StrengthsList } from './StrengthsList'
import { WeaknessesList } from './WeaknessesList'
import { Recommendations } from './Recommendations'
import { CodeViewer } from './CodeViewer'
import { ContentStatsCard } from './ContentStatsCard'
import { PerformanceMetricsCard } from './PerformanceMetricsCard'
import { ExportButton } from './ExportButton'
import type { AnalysisResult as AnalysisResultType } from '@/types'

interface AnalysisResultProps {
  result: AnalysisResultType
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Analyse-Ergebnis</h2>
          <p className="text-sm text-muted-foreground truncate">{result.url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {new Date(result.analyzedAt).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <ExportButton result={result} />
        </div>
      </div>

      <GeoScore score={result.geoScore} summary={result.scoreSummary} />

      <Tabs defaultValue="strengths" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
          <TabsTrigger value="strengths" className="flex items-center gap-1 text-xs sm:text-sm">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Staerken</span>
            <span className="sm:hidden">{result.strengths.length}</span>
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex items-center gap-1 text-xs sm:text-sm">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Schwaechen</span>
            <span className="sm:hidden">{result.weaknesses.length}</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1 text-xs sm:text-sm">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Empfehlungen</span>
            <span className="sm:hidden">{result.recommendations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiken</span>
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

        <TabsContent value="stats" className="mt-4">
          {result.contentStats ? (
            <ContentStatsCard stats={result.contentStats} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Keine Statistiken verfuegbar.
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {result.performanceMetrics ? (
            <PerformanceMetricsCard metrics={result.performanceMetrics} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Keine Performance-Daten verfuegbar.
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
