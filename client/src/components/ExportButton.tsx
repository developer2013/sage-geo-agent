import { useState } from 'react'
import { Download, FileJson, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportAsJSON, exportAsPDF } from '@/lib/exportUtils'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult } from '@/types'

interface ExportButtonProps {
  result: AnalysisResult
}

export function ExportButton({ result }: ExportButtonProps) {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportJSON = () => {
    try {
      exportAsJSON(result)
      toast.success(t('export.jsonSuccess'))
    } catch (error) {
      toast.error(t('export.jsonFailed'))
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportAsPDF(result)
      toast.success(t('export.pdfSuccess'))
    } catch (error) {
      toast.error(t('export.pdfFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-1 hidden sm:inline">
            {isExporting ? t('export.exporting') : t('export.export')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          {t('export.asJson')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          {t('export.asPdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
