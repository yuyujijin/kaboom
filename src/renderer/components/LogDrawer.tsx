import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'lucide-react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'

interface LogDrawerProps {
  logPath: string | null
}

export function LogDrawer({ logPath }: LogDrawerProps) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load existing log contents when the drawer opens
  useEffect(() => {
    if (!open || !logPath) return

    let cancelled = false

    window.api.readLog(logPath).then((content) => {
      if (cancelled) return
      setLines(content ? content.split('\n').filter(Boolean) : [])
    })

    return () => { cancelled = true }
  }, [open, logPath])

  // Subscribe to live log lines whenever a logPath is active
  useEffect(() => {
    if (!logPath) return

    const cleanup = window.api.onLogLine((line) => {
      setLines((prev) => [...prev, line])
    })

    return cleanup
  }, [logPath])

  // Clear lines when a new download session starts
  useEffect(() => {
    if (logPath) setLines([])
  }, [logPath])

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 right-3 z-50 shadow-md"
          title="View download logs"
        >
          <Terminal className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Download Logs</SheetTitle>
          {logPath && (
            <p className="text-xs text-muted-foreground truncate" title={logPath}>
              {logPath}
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
            {lines.length === 0
              ? <span className="text-muted-foreground/50">No output yet…</span>
              : lines.join('\n')}
          </pre>
          <div ref={bottomRef} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
