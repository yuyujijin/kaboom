export interface DownloadProgress {
  status: 'downloading' | 'done' | 'error'
  message: string
}
