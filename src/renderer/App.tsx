import React, { useState } from 'react'
import type { DownloadProgress } from '../shared/types'

declare global {
  interface Window {
    api: {
      download: (url: string) => Promise<void>
      onProgress: (callback: (progress: DownloadProgress) => void) => () => void
    }
  }
}

function App() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<DownloadProgress | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!url.trim() || loading) return

    setLoading(true)
    setStatus(null)

    const cleanup = window.api.onProgress((progress) => {
      setStatus(progress)
      if (progress.status === 'done' || progress.status === 'error') {
        setLoading(false)
        cleanup()
      }
    })

    try {
      await window.api.download(url)
    } catch {
      setLoading(false)
      cleanup()
    }
  }

  return (
    <div>
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
      {status && <p>{status.message}</p>}
    </div>
  )
}

export default App
