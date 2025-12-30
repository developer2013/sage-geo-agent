import { Sparkles, History, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onHistoryClick: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Header({ onHistoryClick, darkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sage GEO Agent</h1>
            <p className="text-sm text-muted-foreground">
              Generative Engine Optimization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="outline" onClick={onHistoryClick}>
            <History className="h-4 w-4 mr-2" />
            Historie
          </Button>
        </div>
      </div>
    </header>
  )
}
