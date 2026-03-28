import { spawn } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { DownloadProgress } from '../shared/types'

// Browser to use for cookie extraction — change this to 'firefox', 'safari', etc.
const COOKIES_BROWSER = 'chrome'

function getYtDlpPath(): string {
  const binary = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'

  if (app.isPackaged) {
    return join(process.resourcesPath, binary)
  }

  return join(app.getAppPath(), 'resources', binary)
}

export function download(
  url: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ytDlpPath = getYtDlpPath()
    const outputDir = join(homedir(), 'Music')

    const args = [
      '--cookies-from-browser', COOKIES_BROWSER,
      '-x',
      '--audio-format', 'mp3',
      '-o', join(outputDir, '%(title)s.%(ext)s'),
      url
    ]

    const proc = spawn(ytDlpPath, args)

    proc.stdout.on('data', (data: Buffer) => {
      onProgress({ status: 'downloading', message: data.toString().trim() })
    })

    proc.stderr.on('data', (data: Buffer) => {
      onProgress({ status: 'downloading', message: data.toString().trim() })
    })

    proc.on('close', (code) => {
      if (code === 0) {
        onProgress({ status: 'done', message: 'Download complete' })
        resolve()
      } else {
        const err = `yt-dlp exited with code ${code}`
        onProgress({ status: 'error', message: err })
        reject(new Error(err))
      }
    })

    proc.on('error', (err) => {
      onProgress({ status: 'error', message: err.message })
      reject(err)
    })
  })
}
