export interface Strength {
  title: string
  description: string
}

export interface Weakness {
  priority: 'KRITISCH' | 'MITTEL' | 'NIEDRIG'
  title: string
  description: string
}

export interface Recommendation {
  timeframe: 'SOFORT' | 'KURZFRISTIG' | 'MITTELFRISTIG'
  action: string
  reason: string
}

export interface MetaTag {
  name?: string
  property?: string
  content: string
}

export interface PageCode {
  html: string
  metaTags: MetaTag[]
  schemaMarkup: object[]
  robotsTxt: string | null
}

export interface ImageAnalysis {
  hasVisualContent: boolean
  textInImages: string
  accessibilityIssues: string[]
  recommendations: string[]
}

export interface CtaAnalysis {
  primaryCta: string | null
  ctaCount: number
  ctaQuality: 'GUT' | 'MITTEL' | 'SCHLECHT'
  ctaTexts: string[]
  issues: string[]
}

export interface TableAnalysis {
  tableCount: number
  hasComparisonTable: boolean
  hasPricingTable: boolean
  hasProperHeaders: boolean
  keyData: string[]
  issues: string[]
}

export interface AnalysisResult {
  id: string
  url: string
  analyzedAt: string
  geoScore: number
  scoreSummary: string
  strengths: Strength[]
  weaknesses: Weakness[]
  recommendations: Recommendation[]
  nextStep: string
  pageCode: PageCode
  imageAnalysis?: ImageAnalysis | null
  ctaAnalysis?: CtaAnalysis | null
  tableAnalysis?: TableAnalysis | null
  cached?: boolean
}

export interface HistoryItem {
  id: string
  url: string
  geoScore: number
  analyzedAt: string
}
