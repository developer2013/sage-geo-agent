import { Bot, Info, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AnalysisResult, ContentStats } from '@/types'

interface CitationProbabilityProps {
  result: AnalysisResult
}

interface PlatformProbability {
  name: string
  probability: number
  color: string
  icon: string
  factors: string[]
}

/**
 * Calculates estimated citation probability for different LLM platforms
 * Based on research from Princeton GEO-BENCH and industry observations
 */
function calculateCitationProbabilities(
  geoScore: number,
  contentStats?: ContentStats,
  hasSchema?: boolean
): PlatformProbability[] {
  // Extract relevant metrics from available data
  const wordCount = contentStats?.wordCount || 0
  const externalLinks = contentStats?.externalLinks || 0  // External links often indicate sources
  const listCount = contentStats?.listCount || 0  // Lists often contain structured data
  const tableCount = contentStats?.tableCount || 0  // Tables often contain statistics
  const headings = contentStats?.headingStructure || { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 }
  const totalHeadings = headings.h1 + headings.h2 + headings.h3 + headings.h4 + headings.h5 + headings.h6

  // Normalize factors (0-1 scale)
  const geoFactor = geoScore / 100
  // More external links = more likely has sources
  const sourceFactor = Math.min(1, externalLinks / 10) * 0.8
  // Tables and lists indicate structured/statistical content
  const structuredDataFactor = Math.min(1, (tableCount + listCount) / 8)
  // Good heading structure indicates well-organized content
  const structureFactor = Math.min(1, totalHeadings / 10)
  const schemaFactor = hasSchema ? 1 : 0
  // Comprehensive content (500-3000 words is ideal)
  const comprehensiveFactor = wordCount >= 500 && wordCount <= 3000 ? 1 : wordCount > 3000 ? 0.8 : wordCount / 500

  // Platform-specific weights based on observed behavior
  // ChatGPT: Favors comprehensive, well-structured content
  const chatgptProb = Math.round(
    (geoFactor * 0.45 +
      structuredDataFactor * 0.15 +
      schemaFactor * 0.10 +
      structureFactor * 0.15 +
      comprehensiveFactor * 0.15) * 100
  )

  // Perplexity: Heavy emphasis on citations and sources
  const perplexityProb = Math.round(
    (geoFactor * 0.35 +
      sourceFactor * 0.25 +
      structuredDataFactor * 0.20 +
      schemaFactor * 0.05 +
      comprehensiveFactor * 0.15) * 100
  )

  // Google AI (Gemini): Structured data and E-E-A-T signals
  const googleProb = Math.round(
    (geoFactor * 0.40 +
      structuredDataFactor * 0.15 +
      schemaFactor * 0.20 +
      sourceFactor * 0.10 +
      structureFactor * 0.15) * 100
  )

  // Claude: Quality and nuance, comprehensive content
  const claudeProb = Math.round(
    (geoFactor * 0.40 +
      sourceFactor * 0.20 +
      structuredDataFactor * 0.15 +
      schemaFactor * 0.05 +
      comprehensiveFactor * 0.20) * 100
  )

  return [
    {
      name: 'ChatGPT',
      probability: Math.min(95, Math.max(5, chatgptProb)),
      color: 'bg-emerald-500',
      icon: '🤖',
      factors: ['GEO-Score', 'Struktur', 'Quellenangaben']
    },
    {
      name: 'Perplexity',
      probability: Math.min(95, Math.max(5, perplexityProb)),
      color: 'bg-blue-500',
      icon: '🔍',
      factors: ['Statistiken', 'Zitate', 'Aktualität']
    },
    {
      name: 'Google AI',
      probability: Math.min(95, Math.max(5, googleProb)),
      color: 'bg-red-500',
      icon: '🔷',
      factors: ['Schema-Markup', 'E-E-A-T', 'GEO-Score']
    },
    {
      name: 'Claude',
      probability: Math.min(95, Math.max(5, claudeProb)),
      color: 'bg-orange-500',
      icon: '🧠',
      factors: ['Quellenqualität', 'Zitate', 'Statistiken']
    }
  ]
}

function getProbabilityLabel(prob: number): { label: string; color: string } {
  if (prob >= 75) return { label: 'Hoch', color: 'text-green-600' }
  if (prob >= 50) return { label: 'Mittel', color: 'text-yellow-600' }
  if (prob >= 25) return { label: 'Niedrig', color: 'text-orange-600' }
  return { label: 'Sehr niedrig', color: 'text-red-600' }
}

export function CitationProbability({ result }: CitationProbabilityProps) {
  const hasSchema = result.pageCode?.schemaMarkup &&
    Object.keys(result.pageCode.schemaMarkup).length > 0

  const probabilities = calculateCitationProbabilities(
    result.geoScore,
    result.contentStats ?? undefined,
    hasSchema
  )

  const avgProbability = Math.round(
    probabilities.reduce((sum, p) => sum + p.probability, 0) / probabilities.length
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5" />
          LLM-Zitations-Wahrscheinlichkeit
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Geschätzte Wahrscheinlichkeit, dass diese Seite von verschiedenen
                  LLMs als Quelle zitiert wird. Basiert auf GEO-Score, Statistik-Dichte,
                  Schema-Markup und Quellenangaben.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Dies ist eine Schätzung, keine Garantie.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-medium">Durchschnittliche Chance</span>
          </div>
          <div className={`text-2xl font-bold ${getProbabilityLabel(avgProbability).color}`}>
            {avgProbability}%
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="space-y-3">
          {probabilities.map((platform) => {
            const { label, color } = getProbabilityLabel(platform.probability)
            return (
              <div key={platform.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${color}`}>{label}</span>
                    <span className="font-bold">{platform.probability}%</span>
                  </div>
                </div>
                <Progress value={platform.probability} className={`h-2 ${platform.color}`} />
                <div className="flex gap-1 flex-wrap">
                  {platform.factors.map((factor) => (
                    <span
                      key={factor}
                      className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Improvement Tips */}
        <div className="pt-3 border-t text-sm text-muted-foreground">
          <p className="font-medium mb-1">So erhoehst du deine Chancen:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs">
            {result.geoScore < 70 && <li>GEO-Score auf 70+ verbessern</li>}
            {(result.contentStats?.externalLinks || 0) < 3 && (
              <li>Mehr externe Quellen verlinken</li>
            )}
            {!hasSchema && <li>Schema-Markup (JSON-LD) implementieren</li>}
            {(result.contentStats?.tableCount || 0) < 1 && (
              <li>Tabellen mit Daten/Statistiken hinzufuegen</li>
            )}
            {(result.contentStats?.listCount || 0) < 2 && (
              <li>Strukturierte Listen verwenden</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
