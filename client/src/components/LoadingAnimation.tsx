import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Brain, FileText, Database } from 'lucide-react'

interface ProgressInfo {
  step: number
  message: string
}

interface LoadingAnimationProps {
  isLoading: boolean
  progress?: ProgressInfo | null
}

const steps = [
  { icon: Database, text: 'Prüfe Cache...', step: 0 },
  { icon: Globe, text: 'Lade Webseite...', step: 1 },
  { icon: Brain, text: 'Analysiere mit KI...', step: 2 },
  { icon: FileText, text: 'Erstelle Bericht...', step: 3 },
]

export function LoadingAnimation({ isLoading, progress }: LoadingAnimationProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Use real progress from API or animate based on step
  const currentStep = progress?.step ?? 0
  const currentMessage = progress?.message ?? steps[0]?.text ?? 'Starte...'

  useEffect(() => {
    if (!isLoading) {
      setAnimatedProgress(0)
      return
    }

    // Calculate target progress based on step (each step is ~25%)
    const targetProgress = Math.min(95, (currentStep + 1) * 25)

    // Smoothly animate to target
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress)
        }
        return prev
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isLoading, currentStep])

  if (!isLoading) return null

  const CurrentIcon = steps[currentStep]?.icon || Brain

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
            {steps.map((_, index) => (
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
