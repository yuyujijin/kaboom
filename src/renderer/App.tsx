import { useState } from 'react'
import { Info } from 'lucide-react'
import type { CookiesBrowser, DownloadProgress, TrackInfo } from '../shared/types'
import { NoiseOverlay } from './components/ui/NoiseOverlay'
import { OrangeGlow } from './components/ui/OrangeGlow'
import { DownloadForm } from './components/download/DownloadForm'
import { DownloadStatus } from './components/download/DownloadStatus'
import { RateLimitAlert } from './components/download/RateLimitAlert'
import { TrackList } from './components/track/TrackList'
import { useRateLimit } from './hooks/use-rate-limit'
import { LogDrawer } from './components/LogDrawer'

declare global {
  interface Window {
    api: {
      chooseFolder: () => Promise<string | undefined>
      download: (url: string, browser: CookiesBrowser, dir: string) => Promise<void>
      onProgress: (callback: (progress: DownloadProgress) => void) => () => void
      openFolder: (path: string) => Promise<void>
      showItemInFolder: (path: string) => Promise<void>
      readLog: (path: string) => Promise<string>
      onLogLine: (callback: (line: string) => void) => () => void
      onDownloadStarted: (callback: (logPath: string) => void) => () => void
    }
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [browser, setBrowser] = useState<CookiesBrowser>('chrome')
  const [status, setStatus] = useState<DownloadProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState<{ info: TrackInfo; percent?: number; done?: boolean }[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)
  const [logPath, setLogPath] = useState<string | null>(null)

  const { isRateLimited, rateLimit, setRateLimit } = useRateLimit(loading)

  const handleDownload = async () => {
    if (!url.trim() || loading) return

    const dir = await window.api.chooseFolder()
    if (!dir) return

    setOutputDir(dir)
    setLoading(true)
    setStatus(null)
    setTracks([])

    const cleanupStarted = window.api.onDownloadStarted((lp) => {
      setLogPath(lp)
      cleanupStarted()
    })

    const cleanup = window.api.onProgress((progress) => {
      if (progress.trackInfo) {
        setTracks((prev) => {
          // Mark the last track as done — it just finished
          const updated = prev.length > 0
            ? prev.map((t, i) => i === prev.length - 1 ? { ...t, done: true } : t)
            : prev
          return [...updated, { info: progress.trackInfo! }]
        })
      } else if (progress.percent != null) {
        const idx = progress.current && progress.current > 0 ? progress.current - 1 : 0
        setTracks((prev) =>
          prev.map((t, i) => (i === idx ? { ...t, percent: progress.percent } : t))
        )
      }
      if (progress.rateLimitedAt != null) setRateLimit({ rateLimitedAt: progress.rateLimitedAt, retryAttempt: progress.retryAttempt, maxRetries: progress.maxRetries })
      // Merge to avoid flicker when a trackInfo event (no percent) arrives between tracks
      setStatus((prev) => (prev ? { ...prev, ...progress } : progress))
      if (progress.status === 'done' || progress.status === 'error') {
        setTracks((prev) => prev.map((t) => ({ ...t, done: true })))
        setLoading(false)
        cleanup()
      }
    })

    try {
      await window.api.download(url, browser, dir)
    } catch {
      setLoading(false)
      cleanup()
    }
  }

  const showStatus = status != null && (loading || status.status === 'error')

  return (
    <div className="relative flex h-screen flex-col items-center bg-background text-foreground overflow-hidden">
      <LogDrawer logPath={logPath} />
      <OrangeGlow />
      <NoiseOverlay />
      {/* Sticky top section — form + status */}
      <div className="flex flex-col w-full max-w-2xl px-6 pt-12 pb-8 space-y-4 shrink-0 items-center">
        <h1 className="text-center text-2xl font-bold tracking-tight">🧨 Kaboom</h1>
        <div className="w-4/5 space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Paste a SoundCloud track or playlist URL and Kaboom will download it as MP3.
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <Info className="inline-block mr-1 mb-0.5 h-3.5 w-3.5 shrink-0" />It reads cookies from your browser to access tracks that require a SoundCloud login — nothing is stored or sent anywhere.
          </p>
        </div>
        <DownloadForm
          url={url}
          browser={browser}
          loading={loading}
          rateLimited={isRateLimited}
          onUrlChange={setUrl}
          onBrowserChange={setBrowser}
          onSubmit={handleDownload}
        />
        {outputDir && (
          <button
            onClick={() => window.api.openFolder(outputDir)}
            className="w-full flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          >
            <span className="shrink-0">📁</span>
            <span className="truncate">{outputDir}</span>
          </button>
        )}
        {showStatus && <DownloadStatus status={status} />}
        {!loading && !showStatus && rateLimit?.rateLimitedAt != null && (
          <RateLimitAlert rateLimitedAt={rateLimit.rateLimitedAt} />
        )}
      </div>

      {/* Scrollable track list */}
      <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-8">
        <TrackList tracks={tracks} outputDir={outputDir} />
      </div>
    </div>
  )
}

export default App
