export interface DownloadProgress {
  status: 'downloading' | 'done' | 'error'
  message: string
  /** Current track index (1-based), present for playlists */
  current?: number
  /** Total tracks in playlist */
  total?: number
  /** Download percentage for the current file (0–100) */
  percent?: number
}
