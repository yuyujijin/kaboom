import { spawn } from 'child_process'
import { createWriteStream, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { DownloadProgress } from '../shared/types'

// Browser to use for cookie extraction — change this to 'firefox', 'safari', etc.
const COOKIES_BROWSER = 'chrome'

function getFfmpegPath(): string {
  const binary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  if (app.isPackaged) {
    return join(process.resourcesPath, binary)
  }

  return join(app.getAppPath(), 'node_modules', 'ffmpeg-static', binary)
}

function getYtDlpPath(): string {
  const binary = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'

  if (app.isPackaged) {
    return join(process.resourcesPath, binary)
  }

  return join(app.getAppPath(), 'resources', binary)
}

function createLogStream() {
  const logDir = join(app.getPath('logs'), 'kaboom')
  mkdirSync(logDir, { recursive: true })
  const logPath = join(logDir, `download-${Date.now()}.log`)
  return { stream: createWriteStream(logPath), logPath }
}

export function download(
  url: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ytDlpPath = getYtDlpPath()
    const outputDir = join(homedir(), 'Music')
    const { stream: logStream, logPath } = createLogStream()

    console.log(`yt-dlp log: ${logPath}`)

    const args = [
      '--cookies-from-browser', COOKIES_BROWSER,
      '--ffmpeg-location', getFfmpegPath(),
      '-f', 'bestaudio',
      '-x',
      '--audio-format', 'flac',
      '-o', join(outputDir, '%(title)s.%(ext)s'),
      url
    ]

    const proc = spawn(ytDlpPath, args)

    proc.stdout.on('data', (data: Buffer) => {
      const message = data.toString().trim()
      logStream.write(`[stdout] ${message}\n`)
      onProgress({ status: 'downloading', message })
    })

    proc.stderr.on('data', (data: Buffer) => {
      const message = data.toString().trim()
      logStream.write(`[stderr] ${message}\n`)
      onProgress({ status: 'downloading', message })
    })

    proc.on('close', (code) => {
      logStream.write(`[exit] code ${code}\n`)
      logStream.end()
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
      logStream.write(`[error] ${err.message}\n`)
      logStream.end()
      onProgress({ status: 'error', message: err.message })
      reject(err)
    })
  })
}
