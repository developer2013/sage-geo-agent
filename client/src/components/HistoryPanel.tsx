import { useState } from 'react'
import { X, Clock, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { HistoryItem } from '@/types'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  onSelectItem: (id: string) => void
  onDeleteItem: (id: string) => void
}

export function HistoryPanel({
  isOpen,
  onClose,
  history,
  onSelectItem,
  onDeleteItem,
}: HistoryPanelProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchEnd - touchStart
    if (distance > 100) {
      onClose()
    }
    setTouchStart(null)
  }

  const handleDelete = () => {
    if (deleteId) {
      onDeleteItem(deleteId)
      toast.success('Analyse geloescht')
      setDeleteId(null)
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const truncateUrl = (url: string, maxLength: number = 30) => {
    try {
      const urlObj = new URL(url)
      const display = urlObj.hostname + urlObj.pathname
      if (display.length > maxLength) {
        return display.substring(0, maxLength) + '...'
      }
      return display
    } catch {
      return url.substring(0, maxLength)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl transition-transform"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="font-semibold">Analyse-Historie</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Noch keine Analysen durchgefuehrt.
              </p>
            ) : (
              history.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => onSelectItem(item.id)}
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {truncateUrl(item.url)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span className={`font-bold ${getScoreColor(item.geoScore)}`}>
                            Score: {item.geoScore}
                          </span>
                          <span className="text-muted-foreground">
                            {formatDate(item.analyzedAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(item.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>

    <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Analyse loeschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Aktion kann nicht rueckgaengig gemacht werden. Die Analyse wird dauerhaft geloescht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            Loeschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
