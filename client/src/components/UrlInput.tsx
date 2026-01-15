import { useState } from 'react'
import { Search, Loader2, Image, Camera, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

export interface ImageSettings {
  includeScreenshot: boolean
  includeImages: boolean
  maxImages: number
}

interface UrlInputProps {
  onAnalyze: (url: string, imageSettings: ImageSettings) => void
  isLoading: boolean
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    includeScreenshot: true,
    includeImages: true,
    maxImages: 3
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
      onAnalyze(formattedUrl, imageSettings)
    }
  }

  return (
    <Card className="neu-card w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 neu-icon p-1.5">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="URL eingeben (z.B. example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-14"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !url.trim()} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analysiere...
              </>
            ) : (
              'Analysieren'
            )}
          </Button>
        </form>

        {/* Image Settings Toggle */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Image className="h-4 w-4" />
            Bild-Einstellungen
            {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showSettings && (
            <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-4">
              {/* Screenshot Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="screenshot-toggle" className="text-sm cursor-pointer">
                    Screenshot analysieren
                  </Label>
                </div>
                <Switch
                  id="screenshot-toggle"
                  checked={imageSettings.includeScreenshot}
                  onCheckedChange={(checked) =>
                    setImageSettings({ ...imageSettings, includeScreenshot: checked })
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Images Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="images-toggle" className="text-sm cursor-pointer">
                    Bilder auf der Seite analysieren
                  </Label>
                </div>
                <Switch
                  id="images-toggle"
                  checked={imageSettings.includeImages}
                  onCheckedChange={(checked) =>
                    setImageSettings({ ...imageSettings, includeImages: checked })
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Max Images Slider */}
              {imageSettings.includeImages && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Max. Bilder: {imageSettings.maxImages}</Label>
                    <span className="text-xs text-muted-foreground">(1-5)</span>
                  </div>
                  <Slider
                    value={[imageSettings.maxImages]}
                    onValueChange={([value]) =>
                      setImageSettings({ ...imageSettings, maxImages: value })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Mehr Bilder = detailliertere visuelle Analyse, aber hoehere Kosten und laengere Analysezeit.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Gib eine URL ein, um die GEO-Tauglichkeit zu analysieren. Die Analyse prueft Schema Markup, Meta-Tags, Struktur und mehr.
        </p>
      </CardContent>
    </Card>
  )
}
