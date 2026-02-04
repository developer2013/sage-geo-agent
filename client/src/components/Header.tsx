import { Sparkles, History, Moon, Sun, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreMonitor } from './ScoreMonitor'
import { CompetitorComparison } from './CompetitorComparison'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onHistoryClick: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export function Header({ onHistoryClick, darkMode, onToggleDarkMode }: HeaderProps) {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de'
    i18n.changeLanguage(newLang)
  }

  return (
    <header className="bg-background shadow-[0_4px_12px_var(--shadow-dark)]">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="neu-icon animate-float">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('header.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CompetitorComparison />
          <ScoreMonitor />
          <Button variant="outline" size="icon" onClick={onToggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5 px-2.5">
            <Globe className="h-4 w-4" />
            <span className="font-medium text-xs">{i18n.language === 'de' ? 'DE' : 'EN'}</span>
          </Button>
          <Button variant="outline" onClick={onHistoryClick}>
            <History className="h-4 w-4 mr-2" />
            {t('header.history')}
          </Button>
        </div>
      </div>
    </header>
  )
}
