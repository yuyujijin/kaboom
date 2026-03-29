import { contextBridge, ipcRenderer } from 'electron'
import type { CookiesBrowser, DownloadProgress } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  download: (url: string, browser: CookiesBrowser): Promise<void> => ipcRenderer.invoke('download', url, browser),

  onProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  }
})
