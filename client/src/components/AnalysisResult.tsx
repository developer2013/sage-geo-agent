import { CheckCircle, XCircle, Lightbulb, Code } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeoScore } from './GeoScore'
import { StrengthsList } from './StrengthsList'
import { WeaknessesList } from './WeaknessesList'
import { Recommendations } from './Recommendations'
import { CodeViewer } from './CodeViewer'
import type { AnalysisResult as AnalysisResultType } from '@/types'

interface AnalysisResultProps {
  result: AnalysisResultType
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Analyse-Ergebnis</h2>
          <p className="text-sm text-muted-foreground">{result.url}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(result.analyzedAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <GeoScore score={result.geoScore} summary={result.scoreSummary} />

      <Tabs defaultValue="strengths" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="strengths" className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Staerken</span>
            <span className="sm:hidden">({result.strengths.length})</span>
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Schwaechen</span>
            <span className="sm:hidden">({result.weaknesses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Empfehlungen</span>
            <span className="sm:hidden">({result.recommendations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-1">
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

        <TabsContent value="code" className="mt-4">
          <CodeViewer pageCode={result.pageCode} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
