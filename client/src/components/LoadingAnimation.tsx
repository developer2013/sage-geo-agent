import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Search, Brain, FileText } from 'lucide-react'

interface ProgressInfo {
  step: number
  message: string
}

interface LoadingAnimationProps {
  isLoading: boolean
  progress?: ProgressInfo | null
}

const defaultSteps = [
  { icon: Globe, text: 'Verbinde mit Webseite...', duration: 2000 },
  { icon: Search, text: 'Scanne Inhalte mit Firecrawl...', duration: 3000 },
  { icon: FileText, text: 'Extrahiere Struktur & Bilder...', duration: 2000 },
  { icon: Brain, text: 'Analysiere mit Claude Opus 4.5...', duration: 8000 },
]

export function LoadingAnimation({ isLoading, progress }: LoadingAnimationProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [fallbackStep, setFallbackStep] = useState(0)

  // Use server progress if available, otherwise use animated fallback
  const currentStep = progress?.step ?? fallbackStep
  const currentMessage = progress?.message ?? defaultSteps[fallbackStep]?.text ?? 'Analysiere...'

  useEffect(() => {
    if (!isLoading) {
      setAnimatedProgress(0)
      setFallbackStep(0)
      return
    }

    // If we have server progress, animate to that step's percentage
    if (progress) {
      const targetProgress = Math.min(95, (progress.step + 1) * 25)
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          if (prev < targetProgress) {
            return Math.min(prev + 3, targetProgress)
          }
          return prev
        })
      }, 50)
      return () => clearInterval(interval)
    }

    // Fallback animation when no server progress
    const totalDuration = defaultSteps.reduce((acc, step) => acc + step.duration, 0)
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += 100
      const newProgress = Math.min(95, (elapsed / totalDuration) * 100)
      setAnimatedProgress(newProgress)

      let stepTime = 0
      for (let i = 0; i < defaultSteps.length; i++) {
        stepTime += defaultSteps[i].duration
        if (elapsed < stepTime) {
          setFallbackStep(i)
          break
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading, progress])

  if (!isLoading) return null

  const CurrentIcon = defaultSteps[Math.min(currentStep, defaultSteps.length - 1)]?.icon || Brain

  return (
    <Card className="neu-card">
      <CardContent className="py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated Icon with Neumorphism */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="neu-icon relative animate-float">
              <CurrentIcon className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Progress Bar with Neumorphism */}
          <div className="w-full max-w-md space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {currentMessage}
              </span>
              <span className="font-mono font-bold text-primary">
                {Math.round(animatedProgress)}%
              </span>
            </div>
            <div className="neu-progress">
              <div
                className="neu-progress-bar"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators with Neumorphism */}
          <div className="flex items-center gap-3">
            {defaultSteps.map((_, index) => (
              <div
                key={index}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
                    : 'bg-background shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]'
                }`}
              />
            ))}
          </div>

          {/* Spinner Badge */}
          <div className="neu-badge flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>GEO-Analyse läuft...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
