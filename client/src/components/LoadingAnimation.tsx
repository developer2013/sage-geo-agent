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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative p-4 rounded-full bg-primary/10">
              <CurrentIcon className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {steps[currentStep]?.text}
              </span>
              <span className="font-mono font-semibold text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-primary scale-100'
                    : 'bg-muted scale-75'
                }`}
              />
            ))}
          </div>

          {/* Spinner */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>GEO-Analyse laeuft...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
