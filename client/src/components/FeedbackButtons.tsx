import { useState } from 'react'
import { ThumbsUp, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface FeedbackButtonsProps {
  /** Unique identifier for the recommendation type (e.g., "add_statistics", "improve_headings") */
  recommendationType: string
  /** Callback when feedback is successfully sent */
  onFeedbackSent?: (action: 'helpful' | 'implemented' | 'dismissed') => void
  /** Optional: compact mode for smaller displays */
  compact?: boolean
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function FeedbackButtons({
  recommendationType,
  onFeedbackSent,
  compact = false
}: FeedbackButtonsProps) {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [sentAction, setSentAction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sendFeedback = async (action: 'helpful' | 'implemented' | 'dismissed') => {
    if (sent || loading) return

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationType,
          action
        })
      })

      if (response.ok) {
        setSent(true)
        setSentAction(action)
        onFeedbackSent?.(action)
      } else {
        console.error('Feedback failed:', await response.text())
      }
    } catch (error) {
      console.error('Feedback error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {sentAction === 'helpful' && <ThumbsUp className="h-3 w-3" />}
        {sentAction === 'implemented' && <Check className="h-3 w-3" />}
        {sentAction === 'dismissed' && <X className="h-3 w-3" />}
        {t('feedback.thanks')}
      </span>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => sendFeedback('helpful')}
          disabled={loading}
          title={t('feedback.helpful')}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => sendFeedback('implemented')}
          disabled={loading}
          title={t('feedback.implemented')}
        >
          <Check className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => sendFeedback('helpful')}
        disabled={loading}
      >
        <ThumbsUp className="h-3 w-3 mr-1" />
        {t('feedback.helpful')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => sendFeedback('implemented')}
        disabled={loading}
      >
        <Check className="h-3 w-3 mr-1" />
        {t('feedback.implemented')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground"
        onClick={() => sendFeedback('dismissed')}
        disabled={loading}
      >
        {t('feedback.notRelevant')}
      </Button>
    </div>
  )
}
