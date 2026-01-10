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
import type { AnalysisResult } from '@/types'

interface ExportButtonProps {
  result: AnalysisResult
}

export function ExportButton({ result }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportJSON = () => {
    try {
      exportAsJSON(result)
      toast.success('JSON exportiert!')
    } catch (error) {
      toast.error('Export fehlgeschlagen')
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportAsPDF(result)
      toast.success('PDF exportiert!')
    } catch (error) {
      toast.error('PDF-Export fehlgeschlagen')
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
            {isExporting ? 'Exportiere...' : 'Exportieren'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Als JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Als PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
