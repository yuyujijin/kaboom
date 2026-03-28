import { contextBridge, ipcRenderer } from 'electron'
import type { DownloadProgress } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  download: (url: string): Promise<void> => ipcRenderer.invoke('download', url),

  onProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  }
})
