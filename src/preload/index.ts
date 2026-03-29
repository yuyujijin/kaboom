import { contextBridge, ipcRenderer } from 'electron'
import type { CookiesBrowser, DownloadProgress } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  chooseFolder: (): Promise<string | undefined> => ipcRenderer.invoke('choose-folder'),
  download: (url: string, browser: CookiesBrowser, dir: string): Promise<void> => ipcRenderer.invoke('download', url, browser, dir),

  onProgress: (callback: (progress: DownloadProgress) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('download:progress', handler)
    return () => ipcRenderer.removeListener('download:progress', handler)
  },

  openFolder: (path: string): Promise<void> => ipcRenderer.invoke('open-folder', path),
  showItemInFolder: (path: string): Promise<void> => ipcRenderer.invoke('show-item-in-folder', path),

  readLog: (path: string): Promise<string> => ipcRenderer.invoke('read-log', path),

  onLogLine: (callback: (line: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, line: string) => callback(line)
    ipcRenderer.on('log:line', handler)
    return () => ipcRenderer.removeListener('log:line', handler)
  },

  onDownloadStarted: (callback: (logPath: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, logPath: string) => callback(logPath)
    ipcRenderer.on('download:started', handler)
    return () => ipcRenderer.removeListener('download:started', handler)
  },
})
