import i18n from '@/i18n'
import type { AnalysisResult } from '@/types'

/**
 * Export analysis result as JSON file
 */
export function exportAsJSON(result: AnalysisResult): void {
  const data = JSON.stringify(result, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `geo-analyse-${result.geoScore}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper to escape HTML entities to prevent XSS when building PDF content
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Export analysis result as PDF file
 * Note: The HTML generated here is only used internally by html2pdf for rendering,
 * it's never inserted into the actual page DOM that users interact with.
 */
export async function exportAsPDF(result: AnalysisResult): Promise<void> {
  // Dynamic import to reduce bundle size
  const html2pdf = (await import('html2pdf.js')).default

  // Escape all user-provided content
  const escapedUrl = escapeHtml(result.url)
  const escapedSummary = escapeHtml(result.scoreSummary)

  // Build strengths HTML safely
  const strengthsHtml = result.strengths.map(s => {
    const title = escapeHtml(s.title)
    const desc = escapeHtml(s.description)
    return `<div style="padding: 10px; margin-bottom: 8px; background: #ecfdf5; border-radius: 8px;">
      <strong>${title}</strong>
      <p style="margin: 5px 0 0; font-size: 14px; color: #666;">${desc}</p>
    </div>`
  }).join('')

  // Build weaknesses HTML safely
  const weaknessesHtml = result.weaknesses.map(w => {
    const title = escapeHtml(w.title)
    const desc = escapeHtml(w.description)
    const priority = escapeHtml(w.priority)
    return `<div style="padding: 10px; margin-bottom: 8px; background: ${getPriorityBg(w.priority)}; border-radius: 8px;">
      <span style="font-size: 12px; font-weight: bold; color: ${getPriorityColor(w.priority)};">
        [${priority}]
      </span>
      <strong style="margin-left: 8px;">${title}</strong>
      <p style="margin: 5px 0 0; font-size: 14px; color: #666;">${desc}</p>
    </div>`
  }).join('')

  // Build recommendations HTML safely
  const recommendationsHtml = result.recommendations.map(r => {
    const action = escapeHtml(r.action)
    const reason = escapeHtml(r.reason)
    const timeframe = escapeHtml(r.timeframe)
    return `<div style="padding: 10px; margin-bottom: 8px; background: #f0f0ff; border-radius: 8px;">
      <span style="font-size: 12px; font-weight: bold; color: #6366f1;">
        [${timeframe}]
      </span>
      <strong style="margin-left: 8px;">${action}</strong>
      <p style="margin: 5px 0 0; font-size: 14px; color: #666;">${reason}</p>
    </div>`
  }).join('')

  // Create the PDF content container
  const content = document.createElement('div')
  content.style.fontFamily = 'system-ui, sans-serif'
  content.style.padding = '20px'
  content.style.maxWidth = '800px'
  content.style.margin = '0 auto'

  const t = i18n.t.bind(i18n)
  const locale = i18n.language === 'en' ? 'en-US' : 'de-DE'
  const reportTitle = escapeHtml(t('pdf.reportTitle'))
  const createdAt = escapeHtml(t('pdf.createdAt', { date: new Date().toLocaleDateString(locale) }))
  const strengthsLabel = escapeHtml(t('pdf.strengths'))
  const weaknessesLabel = escapeHtml(t('pdf.weaknesses'))
  const recommendationsLabel = escapeHtml(t('pdf.recommendations'))
  const footerText = escapeHtml(t('pdf.footer'))

  // Build the full HTML with escaped content
  // This is safe as all dynamic content is escaped above via escapeHtml()
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #6366f1; margin-bottom: 10px;">${reportTitle}</h1>
      <p style="color: #666; font-size: 14px;">${createdAt}</p>
    </div>

    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h2 style="margin-top: 0; color: #333;">URL: ${escapedUrl}</h2>
      <div style="display: flex; align-items: center; gap: 20px;">
        <div style="font-size: 48px; font-weight: bold; color: ${getScoreColor(result.geoScore)};">
          ${result.geoScore}
        </div>
        <div>
          <p style="margin: 0; color: #666;">GEO-Score</p>
          <p style="margin: 5px 0 0; font-size: 14px;">${escapedSummary}</p>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px;">
        ${strengthsLabel} (${result.strengths.length})
      </h3>
      ${strengthsHtml}
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">
        ${weaknessesLabel} (${result.weaknesses.length})
      </h3>
      ${weaknessesHtml}
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 8px;">
        ${recommendationsLabel} (${result.recommendations.length})
      </h3>
      ${recommendationsHtml}
    </div>

    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">
        ${footerText}
      </p>
    </div>
  `

  const opt = {
    margin: 10,
    filename: `geo-analyse-${result.geoScore}-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  }

  await html2pdf().set(opt).from(content).save()
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'KRITISCH': return '#ef4444'
    case 'MITTEL': return '#f59e0b'
    default: return '#3b82f6'
  }
}

function getPriorityBg(priority: string): string {
  switch (priority) {
    case 'KRITISCH': return '#fef2f2'
    case 'MITTEL': return '#fffbeb'
    default: return '#eff6ff'
  }
}
