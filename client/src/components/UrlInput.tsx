import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface UrlInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
      onAnalyze(formattedUrl)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="URL eingeben (z.B. example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !url.trim()}>
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
        <p className="text-xs text-muted-foreground mt-3">
          Gib eine URL ein, um die GEO-Tauglichkeit zu analysieren. Die Analyse prueft Schema Markup, Meta-Tags, Struktur und mehr.
        </p>
      </CardContent>
    </Card>
  )
}
