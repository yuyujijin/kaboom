import { spawn } from 'child_process'
import { createWriteStream, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { DownloadProgress } from '../shared/types'

// Browser to use for cookie extraction — change this to 'firefox', 'safari', etc.
const COOKIES_BROWSER = 'chrome'

const RETRY_MAX = 5
const RETRY_SLEEP_SECONDS = 600 // 10 minutes

// Structured progress line emitted by yt-dlp via --progress-template
const PROGRESS_PREFIX = 'kaboom-progress:'

const PROGRESS_TEMPLATE =
  `${PROGRESS_PREFIX}` +
  `{"downloaded":%(progress.downloaded_bytes|0)s,` +
  `"total":%(progress.total_bytes|0)s,` +
  `"current":%(info.playlist_index|0)s,` +
  `"totalTracks":%(info.n_entries|0)s}`

interface YtDlpProgress {
  downloaded: number
  total: number
  /** 0 when not a playlist */
  current: number
  /** 0 when not a playlist */
  totalTracks: number
}

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
      '--retries', String(RETRY_MAX),
      '--extractor-retries', String(RETRY_MAX),
      '--retry-sleep', `http:${RETRY_SLEEP_SECONDS}`,
      '--newline',
      '--progress-template', PROGRESS_TEMPLATE,
      '-o', join(outputDir, '%(title)s.%(ext)s'),
      url
    ]

    const proc = spawn(ytDlpPath, args)

    let rateLimitedAt: number | undefined
    let retryAttempt: number | undefined

    const retryRe = /Retrying \(attempt (\d+) of (\d+)\)/

    proc.stdout.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue

        logStream.write(`[stdout] ${trimmed}\n`)

        if (!trimmed.startsWith(PROGRESS_PREFIX)) continue

        try {
          const raw: YtDlpProgress = JSON.parse(trimmed.slice(PROGRESS_PREFIX.length))
          const percent = raw.total > 0 ? (raw.downloaded / raw.total) * 100 : undefined

          onProgress({
            status: 'downloading',
            message: trimmed,
            current: raw.current > 0 ? raw.current : undefined,
            total: raw.totalTracks > 0 ? raw.totalTracks : undefined,
            percent,
            rateLimitedAt,
            retryAttempt,
            maxRetries: RETRY_MAX,
          })
        } catch {
          // malformed progress line — ignore
        }
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue

        logStream.write(`[stderr] ${trimmed}\n`)

        if (/429|Too Many Requests/i.test(trimmed)) {
          rateLimitedAt = Date.now()
        }

        const retryMatch = retryRe.exec(trimmed)
        if (retryMatch) {
          retryAttempt = parseInt(retryMatch[1], 10)
        }

        onProgress({
          status: 'downloading',
          message: trimmed,
          rateLimitedAt,
          retryAttempt,
          maxRetries: RETRY_MAX,
        })
      }
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
