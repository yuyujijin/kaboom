import { useState } from 'react'
import type { CookiesBrowser, DownloadProgress, TrackInfo } from '../shared/types'

declare global {
  interface Window {
    api: {
      download: (url: string, browser: CookiesBrowser) => Promise<void>
      onProgress: (callback: (progress: DownloadProgress) => void) => () => void
    }
  }
}

const BROWSERS: CookiesBrowser[] = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'chromium', 'opera', 'vivaldi']

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
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

  return (
    <div>
      <select
        value={browser}
        onChange={(e) => setBrowser(e.target.value as CookiesBrowser)}
        disabled={loading}
      >
        {BROWSERS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
        placeholder="SoundCloud URL"
        disabled={loading}
      />
      <button onClick={handleDownload} disabled={loading || !url.trim()}>
        {loading ? 'Downloading...' : 'Download'}
      </button>
      {tracks.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0' }}>
          {tracks.map((track, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #333' }}>
              {track.thumbnail && (
                <img src={track.thumbnail} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ fontSize: '0.85em', opacity: 0.7 }}>{track.author} · {formatDuration(track.duration)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {status && (
        <div>
          {status.total != null && (
            <p>Track {status.current} of {status.total}</p>
          )}
          {status.percent != null && (
            <progress value={status.percent} max={100} style={{ width: '100%' }} />
          )}
          {status.warning != null && (
            <p style={{ color: 'orange' }}>{status.warning}</p>
          )}
          {status.rateLimitedAt != null && (
            <p>Rate limited at {new Date(status.rateLimitedAt).toLocaleTimeString()}</p>
          )}
          {status.retryAttempt != null && (
            <p>Retry {status.retryAttempt} / {status.maxRetries}</p>
          )}
          <p>{status.message}</p>
        </div>
      )}
    </div>
  )
}

export default App
