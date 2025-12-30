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
}

export interface HistoryItem {
  id: string
  url: string
  geoScore: number
  analyzedAt: string
}
