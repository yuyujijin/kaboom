import { useState } from 'react'
import type { CookiesBrowser, DownloadProgress, TrackInfo } from '../shared/types'
import { DownloadForm } from './components/download/DownloadForm'
import { DownloadStatus } from './components/download/DownloadStatus'
import { TrackList } from './components/track/TrackList'

declare global {
  interface Window {
    api: {
      download: (url: string, browser: CookiesBrowser) => Promise<void>
      onProgress: (callback: (progress: DownloadProgress) => void) => () => void
    }
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [browser, setBrowser] = useState<CookiesBrowser>('chrome')
  const [status, setStatus] = useState<DownloadProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [tracks, setTracks] = useState<TrackInfo[]>([])

  const handleDownload = async () => {
    if (!url.trim() || loading) return

    setLoading(true)
    setStatus(null)
    setTracks([])

    const cleanup = window.api.onProgress((progress) => {
      if (progress.trackInfo) {
        setTracks((prev) => [...prev, progress.trackInfo!])
      }
      setStatus(progress)
      if (progress.status === 'done' || progress.status === 'error') {
        setLoading(false)
        cleanup()
      }
    })

    try {
      await window.api.download(url, browser)
    } catch {
      setLoading(false)
      cleanup()
    }
  }

  const showStatus = status != null && (loading || status.status === 'error')

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground">
      {/* Top section — form + status */}
      <div className="w-full max-w-2xl px-6 pt-12 pb-8 space-y-4">
        <h1 className="text-center text-2xl font-bold tracking-tight">Kaboom</h1>
        <DownloadForm
          url={url}
          browser={browser}
          loading={loading}
          onUrlChange={setUrl}
          onBrowserChange={setBrowser}
          onSubmit={handleDownload}
        />
        {showStatus && <DownloadStatus status={status} />}
      </div>

      {/* Downloaded tracks */}
      <div className="w-full max-w-2xl px-6 pb-8">
        <TrackList tracks={tracks} />
      </div>
    </div>
  )
}

export default App
