import { spawn } from 'child_process'
import { createWriteStream, existsSync, mkdirSync, symlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { CookiesBrowser, DownloadProgress, TrackInfo } from '../shared/types'

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

// Track metadata line emitted by yt-dlp via --print
const TRACK_PREFIX = 'kaboom-track:'

const TRACK_PRINT_TEMPLATE =
  `${TRACK_PREFIX}` +
  `{"title":%(title)j,` +
  `"author":%(uploader)j,` +
  `"duration":%(duration|0)s,` +
  `"thumbnail":%(thumbnail)j}`

interface YtDlpProgress {
  downloaded: number
  total: number
  /** 0 when not a playlist */
  current: number
  /** 0 when not a playlist */
  totalTracks: number
}

// Returns a directory containing both ffmpeg and ffprobe, as yt-dlp requires.
// In dev: symlinks both binaries into a shared temp dir.
// When packaged: assumes both are bundled in resourcesPath.
function getToolsDir(): string {
  if (app.isPackaged) {
    return process.resourcesPath
  }

  const ext = process.platform === 'win32' ? '.exe' : ''
  const dir = join(app.getPath('temp'), 'kaboom-tools')
  mkdirSync(dir, { recursive: true })

  const link = (src: string, name: string) => {
    const dest = join(dir, name)
    if (!existsSync(dest)) symlinkSync(src, dest)
  }

  link(
    join(app.getAppPath(), 'node_modules', 'ffmpeg-static', `ffmpeg${ext}`),
    `ffmpeg${ext}`
  )
  link(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (require('ffprobe-static') as { path: string }).path,
    `ffprobe${ext}`
  )

  return dir
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
  browser: CookiesBrowser,
  outputDir: string,
  onProgress: (progress: DownloadProgress) => void,
  onLogLine?: (line: string) => void
): { promise: Promise<void>; logPath: string } {
  const { stream: logStream, logPath } = createLogStream()

  const writeLine = (line: string) => {
    logStream.write(`${line}\n`)
    onLogLine?.(line)
  }

  const promise = new Promise<void>((resolve, reject) => {
    const ytDlpPath = getYtDlpPath()

    const args = [
      '--cookies-from-browser', browser,
      '--ffmpeg-location', getToolsDir(),
      '-f', 'bestaudio[acodec=aac]/bestaudio',
      '--retries', String(RETRY_MAX),
      '--extractor-retries', String(RETRY_MAX),
      '--retry-sleep', `http:${RETRY_SLEEP_SECONDS}`,
      '--retry-sleep', `extractor:${RETRY_SLEEP_SECONDS}`,
      '--embed-metadata',
      '--embed-thumbnail',
      '--print', TRACK_PRINT_TEMPLATE,
      '--newline',
      '--progress',
      '--progress-template', PROGRESS_TEMPLATE,
      '--force-ipv4',
      '--no-simulate',
      '--no-quiet',
      '-o', join(outputDir, '%(title)s.%(ext)s'),
      url
    ]

    const proc = spawn(ytDlpPath, args)

    let rateLimitedAt: number | undefined
    let retryAttempt: number | undefined
    let warning: string | undefined

    const retryRe = /Retrying \((\d+)\/(\d+)\)/
    const credentialsRe = /Original download format is only available for registered users/

    proc.stdout.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue

        writeLine(`[stdout] ${trimmed}`)

        if (trimmed.startsWith(TRACK_PREFIX)) {
          try {
            const trackInfo: TrackInfo = JSON.parse(trimmed.slice(TRACK_PREFIX.length))
            onProgress({ status: 'downloading', message: trimmed, trackInfo })
          } catch {
            // malformed track line — ignore
          }
          continue
        }

        if (!trimmed.startsWith(PROGRESS_PREFIX)) continue

        try {
          const raw: YtDlpProgress = JSON.parse(trimmed.slice(PROGRESS_PREFIX.length))
          const percent = raw.total ? (raw.downloaded / raw.total) * 100 : 0

          onProgress({
            status: 'downloading',
            message: trimmed,
            current: raw.current > 0 ? raw.current : undefined,
            total: raw.totalTracks > 0 ? raw.totalTracks : undefined,
            percent,
            rateLimitedAt,
            retryAttempt,
            maxRetries: RETRY_MAX,
            warning,
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

        writeLine(`[stderr] ${trimmed}`)

        if (/429|Too Many Requests/i.test(trimmed)) {
          rateLimitedAt = Date.now()
        }

        const retryMatch = retryRe.exec(trimmed)
        if (retryMatch) {
          retryAttempt = parseInt(retryMatch[1], 10)
        }

        if (credentialsRe.test(trimmed)) {
          warning = 'Not logged in to SoundCloud — downloading at lower quality'
        }

        onProgress({
          status: 'downloading',
          message: trimmed,
          rateLimitedAt,
          retryAttempt,
          maxRetries: RETRY_MAX,
          warning,
        })
      }
    })

    proc.on('close', (code) => {
      writeLine(`[exit] code ${code}`)
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
      writeLine(`[error] ${err.message}`)
      logStream.end()
      onProgress({ status: 'error', message: err.message })
      reject(err)
    })
  })

  return { promise, logPath }
}
