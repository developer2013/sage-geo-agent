import { useState } from 'react'
import { Code, FileCode, Bot, FileText, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { PageCode } from '@/types'

interface CopyButtonProps {
  text: string
  label: string
}

function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) {
      toast.error('Nichts zum Kopieren')
      return
    }
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} kopiert!`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="ml-1 hidden sm:inline">{copied ? 'Kopiert' : 'Kopieren'}</span>
    </Button>
  )
}

interface CodeViewerProps {
  pageCode: PageCode
}

export function CodeViewer({ pageCode }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState('html')

  const formatHtml = (html: string) => {
    // Truncate if too long
    if (html.length > 50000) {
      return html.substring(0, 50000) + '\n\n... (truncated)'
    }
    return html
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="html" className="flex items-center gap-1">
            <FileCode className="h-4 w-4" />
            <span className="hidden sm:inline">HTML</span>
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Meta</span>
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Schema</span>
          </TabsTrigger>
          <TabsTrigger value="robots" className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Robots</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="html">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  HTML-Quellcode
                </CardTitle>
                <CopyButton text={pageCode.html} label="HTML" />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                  {formatHtml(pageCode.html)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="h-4 w-4" />
                Meta-Tags ({pageCode.metaTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                {pageCode.metaTags.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Keine Meta-Tags gefunden.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pageCode.metaTags.map((tag, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {tag.name || tag.property || 'meta'}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono break-all">
                          {tag.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Schema.org / JSON-LD ({pageCode.schemaMarkup.length})
                </CardTitle>
                {pageCode.schemaMarkup.length > 0 && (
                  <CopyButton
                    text={JSON.stringify(pageCode.schemaMarkup, null, 2)}
                    label="Schema"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                {pageCode.schemaMarkup.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Kein Schema Markup gefunden.
                  </p>
                ) : (
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(pageCode.schemaMarkup, null, 2)}
                  </pre>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="robots">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  robots.txt
                </CardTitle>
                {pageCode.robotsTxt && (
                  <CopyButton text={pageCode.robotsTxt} label="robots.txt" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border">
                {pageCode.robotsTxt ? (
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                    {pageCode.robotsTxt}
                  </pre>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Keine robots.txt gefunden oder nicht abrufbar.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
