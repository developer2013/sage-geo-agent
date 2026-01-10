import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Search, Brain, FileText } from 'lucide-react'

interface LoadingAnimationProps {
  isLoading: boolean
}

const steps = [
  { icon: Globe, text: 'Verbinde mit Webseite...', duration: 2000 },
  { icon: Search, text: 'Scanne Inhalte mit Firecrawl...', duration: 3000 },
  { icon: FileText, text: 'Extrahiere Struktur & Bilder...', duration: 2000 },
  { icon: Brain, text: 'Analysiere mit Claude Opus 4.5...', duration: 8000 },
]

export function LoadingAnimation({ isLoading }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    // Calculate total duration and step thresholds
    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0)
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += 100

      // Calculate progress percentage (cap at 95% until complete)
      const newProgress = Math.min(95, (elapsed / totalDuration) * 100)
      setProgress(newProgress)

      // Determine current step
      let stepTime = 0
      for (let i = 0; i < steps.length; i++) {
        stepTime += steps[i].duration
        if (elapsed < stepTime) {
          setCurrentStep(i)
          break
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading])

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
                {steps[currentStep]?.text}
              </span>
              <span className="font-mono font-bold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="neu-progress">
              <div
                className="neu-progress-bar"
                style={{ width: `${progress}%` }}
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
            <span>GEO-Analyse laeuft...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
