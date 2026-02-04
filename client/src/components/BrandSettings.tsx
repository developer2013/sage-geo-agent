import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, ChevronDown } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'

interface Audience {
  id: string
  name: string
  description: string
}

export interface BrandSettingsState {
  useSageBrand: boolean
  targetAudience: string
}

interface BrandSettingsProps {
  settings: BrandSettingsState
  onChange: (settings: BrandSettingsState) => void
}

const API_BASE = import.meta.env.VITE_API_URL || ''

export function BrandSettings({ settings, onChange }: BrandSettingsProps) {
  const { t } = useTranslation()
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadAudiences()
  }, [])

  const loadAudiences = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/brand/audiences`)
      const data = await response.json()
      setAudiences(data.audiences || [])
    } catch (error) {
      console.error('Failed to load audiences:', error)
    }
  }

  const handleToggle = (checked: boolean) => {
    onChange({ ...settings, useSageBrand: checked })
    if (checked && !isOpen) {
      setIsOpen(true)
    }
  }

  const handleAudienceChange = (value: string) => {
    onChange({ ...settings, targetAudience: value })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border p-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="sage-brand"
              checked={settings.useSageBrand}
              onCheckedChange={handleToggle}
            />
            <Label
              htmlFor="sage-brand"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">{t('brand.sageBrandVoice')}</span>
            </Label>
          </div>
          {settings.useSageBrand && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('brand.targetAudience')}</Label>
            <Select
              value={settings.targetAudience}
              onValueChange={handleAudienceChange}
              disabled={!settings.useSageBrand}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('brand.selectAudience')} />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((audience) => (
                  <SelectItem key={audience.id} value={audience.id}>
                    <div>
                      <div className="font-medium">{audience.name}</div>
                      <div className="text-xs text-muted-foreground">{audience.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground bg-primary/5 rounded p-2">
            <p className="font-medium mb-1">{t('brand.whenEnabled')}</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t('brand.infoToneOfVoice')}</li>
              <li>{t('brand.infoTargetMessaging')}</li>
              <li>{t('brand.infoCustomCtas')}</li>
            </ul>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export const defaultBrandSettings: BrandSettingsState = {
  useSageBrand: false,
  targetAudience: 'smallBusiness'
}
