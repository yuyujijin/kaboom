import { useEffect, useState } from 'react'
import type { CookiesBrowser, DownloadProgress, TrackInfo } from '../shared/types'
import { DownloadForm } from './components/download/DownloadForm'
import { DownloadStatus } from './components/download/DownloadStatus'
import { RateLimitAlert } from './components/download/RateLimitAlert'
import { TrackList } from './components/track/TrackList'
import { useLocalStorage } from './hooks/local-storage'

declare global {
  interface Window {
    api: {
      download: (url: string, browser: CookiesBrowser) => Promise<string | undefined>
      onProgress: (callback: (progress: DownloadProgress) => void) => () => void
      openFolder: (path: string) => Promise<void>
    }
  }
}

function App() {
  const [url, setUrl] = useState('')
  const { value: rateLimit, setValue: setRateLimit } = useLocalStorage<{ rateLimitedAt: number; retryAttempt?: number; maxRetries?: number }>('soundcloud-rate-limit')
  const [browser, setBrowser] = useState<CookiesBrowser>('chrome')
  const [status, setStatus] = useState<DownloadProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState<{ info: TrackInfo; percent?: number }[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!url.trim() || loading) return

    setLoading(true)
    setStatus(null)
    setTracks([])

    const cleanup = window.api.onProgress((progress) => {
      if (progress.trackInfo) {
        setTracks((prev) => [...prev, { info: progress.trackInfo! }])
      } else if (progress.percent != null) {
        const idx = progress.current && progress.current > 0 ? progress.current - 1 : 0
        setTracks((prev) =>
          prev.map((t, i) => (i === idx ? { ...t, percent: progress.percent } : t))
        )
      }
      if (progress.rateLimitedAt != null) setRateLimit({ rateLimitedAt: progress.rateLimitedAt, retryAttempt: progress.retryAttempt, maxRetries: progress.maxRetries })
      setStatus(progress)
      if (progress.status === 'done' || progress.status === 'error') {
        setLoading(false)
        cleanup()
      }
    })

    try {
      const dir = await window.api.download(url, browser)
      if (dir) setOutputDir(dir)
    } catch {
      setLoading(false)
      cleanup()
    }
  }

  const showStatus = status != null && (loading || status.status === 'error')

  const checkRateLimited = () =>
    !loading && rateLimit != null && Date.now() < rateLimit.rateLimitedAt + 600_000

  const [isRateLimited, setIsRateLimited] = useState(checkRateLimited)

  useEffect(() => {
    setIsRateLimited(checkRateLimited())
    if (!checkRateLimited()) return
    const id = setInterval(() => {
      const still = checkRateLimited()
      setIsRateLimited(still)
      if (!still) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [rateLimit, loading])

  return (
    <div className="flex h-screen flex-col items-center bg-background text-foreground">
      {/* Sticky top section — form + status */}
      <div className="w-full max-w-2xl px-6 pt-12 pb-8 space-y-4 shrink-0">
        <h1 className="text-center text-2xl font-bold tracking-tight">Kaboom</h1>
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
        {!loading && !showStatus && rateLimit != null && (
          <RateLimitAlert rateLimitedAt={rateLimit.rateLimitedAt} />
        )}
      </div>

      {/* Scrollable track list */}
      <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-8">
        <TrackList tracks={tracks} allDone={status?.status === 'done'} />
      </div>
    </div>
  )
}

export default App
