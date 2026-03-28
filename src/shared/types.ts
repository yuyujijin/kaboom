export type CookiesBrowser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'brave' | 'chromium' | 'opera' | 'vivaldi'


export interface DownloadProgress {
  status: 'downloading' | 'done' | 'error'
  message: string
  /** Current track index (1-based), present for playlists */
  current?: number
  /** Total tracks in playlist */
  total?: number
  /** Download percentage for the current file (0–100) */
  percent?: number
  /** Unix timestamp (ms) of the last 429 rate limit hit */
  rateLimitedAt?: number
  /** Current retry attempt number */
  retryAttempt?: number
  /** Max configured retries */
  maxRetries?: number
  /** Non-fatal warning to surface in the UI (e.g. missing credentials) */
  warning?: string
}
