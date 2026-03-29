import { Download, Loader2 } from 'lucide-react'
import type { CookiesBrowser } from '../../../shared/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { cn } from '../../lib/utils'

const BROWSERS: CookiesBrowser[] = [
  'chrome',
  'firefox',
  'safari',
  'edge',
  'brave',
  'chromium',
  'opera',
  'vivaldi',
]

interface DownloadFormProps {
  url: string
  browser: CookiesBrowser
  loading: boolean
  rateLimited: boolean
  onUrlChange: (url: string) => void
  onBrowserChange: (browser: CookiesBrowser) => void
  onSubmit: () => void
}

export function DownloadForm({
  url,
  browser,
  loading,
  rateLimited,
  onUrlChange,
  onBrowserChange,
  onSubmit,
}: DownloadFormProps) {
  const disabled = loading || rateLimited

  return (
    <div className="flex w-full gap-2 sticky top-0">
      <Input
        className="flex-1"
        placeholder="SoundCloud URL..."
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && onSubmit()}
        disabled={disabled}
      />
      <Select
        value={browser}
        onValueChange={(v) => onBrowserChange(v as CookiesBrowser)}
        disabled={disabled}
      >
        <SelectTrigger className="w-32">
          <SelectValue className="capitalize" />
        </SelectTrigger>
        <SelectContent>
          {BROWSERS.map((b) => (
            <SelectItem key={b} value={b} className="capitalize" >
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onSubmit} disabled={disabled || !url.trim()}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Downloading
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download
          </>
        )}
      </Button>
    </div>
  )
}
