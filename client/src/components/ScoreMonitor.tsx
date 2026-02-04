import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MonitoredUrl {
  id: number
  url: string
  name: string | null
  lastScore: number | null
  lastChecked: string | null
  alertThreshold: number
  enabled: number
  createdAt: string
}

interface Alert {
  id: number
  url: string
  name: string | null
  oldScore: number
  newScore: number
  change: number
  alertType: 'improvement' | 'decline'
  createdAt: string
  seen?: number
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function ScoreMonitor() {
  const { t, i18n } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [monitoredUrls, setMonitoredUrls] = useState<MonitoredUrl[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unseenCount, setUnseenCount] = useState(0)

  // Form state
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  // Load data on mount and when dialog opens
  useEffect(() => {
    loadUnseenAlerts()
  }, [])

  useEffect(() => {
    if (dialogOpen) {
      loadMonitoredUrls()
      loadAlerts()
    }
  }, [dialogOpen])

  const loadMonitoredUrls = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/monitor/urls`)
      const data = await response.json()
      setMonitoredUrls(data.urls || [])
    } catch (error) {
      console.error('Failed to load monitored URLs:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/monitor/alerts?limit=20`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const loadUnseenAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/monitor/alerts/unseen`)
      const data = await response.json()
      setUnseenCount(data.count || 0)
    } catch (error) {
      console.error('Failed to load unseen alerts:', error)
    }
  }

  const addUrl = async () => {
    if (!newUrl.trim()) {
      setAddError(t('monitor.urlRequired'))
      return
    }

    setLoading(true)
    setAddError(null)

    try {
      const response = await fetch(`${API_BASE}/api/monitor/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl.trim(),
          name: newName.trim() || null,
          alertThreshold: 5
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('monitor.addError'))
      }

      setNewUrl('')
      setNewName('')
      loadMonitoredUrls()
    } catch (error) {
      setAddError(error instanceof Error ? error.message : t('monitor.addError'))
    } finally {
      setLoading(false)
    }
  }

  const removeUrl = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/monitor/urls/${id}`, { method: 'DELETE' })
      loadMonitoredUrls()
    } catch (error) {
      console.error('Failed to remove URL:', error)
    }
  }

  const toggleUrl = async (id: number, enabled: boolean) => {
    try {
      await fetch(`${API_BASE}/api/monitor/urls/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      loadMonitoredUrls()
    } catch (error) {
      console.error('Failed to toggle URL:', error)
    }
  }

  const markAllSeen = async () => {
    const unseenIds = alerts.filter(a => !a.seen).map(a => a.id)
    if (unseenIds.length === 0) return

    try {
      await fetch(`${API_BASE}/api/monitor/alerts/seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unseenIds })
      })
      loadAlerts()
      loadUnseenAlerts()
    } catch (error) {
      console.error('Failed to mark alerts as seen:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <>
      {/* Notification Bell with Badge */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unseenCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">{t('monitor.scoreAlerts')}</h4>
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('monitor.noAlerts')}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded-lg border text-sm ${!alert.seen ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate max-w-[150px]">
                      {alert.name || extractDomain(alert.url)}
                    </span>
                    {alert.alertType === 'improvement' ? (
                      <Badge className="bg-green-500 text-white text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{alert.change}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {alert.change}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {alert.oldScore} → {alert.newScore} • {formatDate(alert.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {unseenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={markAllSeen}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('monitor.markAllRead')}
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Full Settings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('monitor.scoreMonitoring')}
            </DialogTitle>
            <DialogDescription>
              {t('monitor.monitorDescription')}
            </DialogDescription>
          </DialogHeader>

          {/* Add URL Form */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('monitor.addUrl')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={t('monitor.urlPlaceholder')}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder={t('monitor.namePlaceholder')}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-40"
                />
                <Button onClick={addUrl} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {addError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {addError}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Monitored URLs List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('monitor.monitoredUrls')} ({monitoredUrls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {monitoredUrls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('monitor.noMonitoredUrls')}
                </p>
              ) : (
                <div className="space-y-2">
                  {monitoredUrls.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${!item.enabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {item.name || extractDomain(item.url)}
                          </span>
                          {item.lastScore !== null && (
                            <Badge variant="outline" className={getScoreColor(item.lastScore)}>
                              {item.lastScore}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.url}
                        </div>
                        {item.lastChecked && (
                          <div className="text-xs text-muted-foreground">
                            {t('monitor.lastCheck')}: {formatDate(item.lastChecked)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Switch
                          checked={item.enabled === 1}
                          onCheckedChange={(checked) => toggleUrl(item.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUrl(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert History */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('monitor.alertHistory')}</CardTitle>
                {unseenCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllSeen}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {t('monitor.allRead')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('monitor.noAlertsDescription')}
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${!alert.seen ? 'bg-primary/5 border-primary/20' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {alert.alertType === 'improvement' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium truncate">
                            {alert.name || extractDomain(alert.url)}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          <span className={getScoreColor(alert.oldScore)}>{alert.oldScore}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className={getScoreColor(alert.newScore)}>{alert.newScore}</span>
                          <span className="text-muted-foreground ml-2">
                            ({alert.change > 0 ? '+' : ''}{alert.change} {t('common.points')})
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {formatDate(alert.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}
