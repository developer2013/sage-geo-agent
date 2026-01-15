export interface Strength {
  title: string
  description: string
}

export interface Weakness {
  priority: 'KRITISCH' | 'MITTEL' | 'NIEDRIG'
  title: string
  description: string
}

export interface RecommendationImpact {
  level: 'HOCH' | 'MITTEL' | 'NIEDRIG'
  percentage: string  // e.g., '+30-40%' or 'Variabel'
  source: string      // e.g., 'Princeton GEO-BENCH' or 'Best Practice'
}

export interface Recommendation {
  timeframe: 'SOFORT' | 'KURZFRISTIG' | 'MITTELFRISTIG'
  action: string
  reason: string
  impact?: RecommendationImpact  // Optional for backwards compatibility
}

export interface MetaTag {
  name?: string
  property?: string
  content: string
}

export interface PageCode {
  html: string
  markdown?: string | null  // For better Claude chat context
  metaTags: MetaTag[]
  schemaMarkup: object[]
  robotsTxt: string | null
  metadata?: {
    title?: string
    description?: string
    [key: string]: unknown
  } | null
  usedFirecrawl?: boolean
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
  contentStats?: ContentStats | null
  performanceMetrics?: PerformanceMetrics | null
  serpAnalysis?: SerpAnalysis | null
  cached?: boolean
}

export interface HistoryItem {
  id: string
  url: string
  geoScore: number
  analyzedAt: string
}

export interface ContentStats {
  wordCount: number
  imageCount: number
  imagesWithAlt: number
  imagesWithoutAlt: number
  internalLinks: number
  externalLinks: number
  headingStructure: {
    h1: number
    h2: number
    h3: number
    h4: number
    h5: number
    h6: number
  }
  listCount: number
  tableCount: number
  estimatedReadTime: number
}

export interface PerformanceMetrics {
  estimatedLCP: 'fast' | 'moderate' | 'slow'
  estimatedCLS: 'good' | 'needs-improvement' | 'poor'
  contentSize: {
    html: number
    images: number
    total: number
  }
  suggestions: string[]
}

// SERP Click-Worthiness Analysis Types
export interface SerpMetric {
  score: number
  label: string
  issues: string[]
  suggestions: string[]
}

export interface AttentionTrigger {
  keyword: string
  found: boolean
  location: 'title' | 'description' | 'both' | 'none'
}

export interface SerpRecommendation {
  priority: 'HOCH' | 'MITTEL' | 'NIEDRIG'
  action: string
  currentValue?: string
  suggestedValue?: string
}

export interface SerpAnalysis {
  clickWorthinessScore: number
  metrics: {
    titleQuality: SerpMetric
    descriptionQuality: SerpMetric
    b2bSignals: SerpMetric
    trustTriggers: SerpMetric
    featureClarity: SerpMetric
    videoContent: SerpMetric
  }
  attentionTriggers: AttentionTrigger[]
  serpPreview: {
    title: string
    displayUrl: string
    description: string
    truncatedTitle: boolean
    truncatedDescription: boolean
  }
  recommendations: SerpRecommendation[]
}
