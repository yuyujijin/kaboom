import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RESOURCES_DIR = join(__dirname, '..', 'resources')

const YTDLP_URLS = {
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
}

const BINARY_NAMES = {
  win32: 'yt-dlp.exe',
  darwin: 'yt-dlp',
  linux: 'yt-dlp'
}

async function downloadYtDlp() {
  const platform = process.platform
  const url = YTDLP_URLS[platform]
  const binaryName = BINARY_NAMES[platform]

  if (!url) {
    console.error(`Unsupported platform: ${platform}`)
    process.exit(1)
  }

  mkdirSync(RESOURCES_DIR, { recursive: true })

  const dest = join(RESOURCES_DIR, binaryName)

  if (existsSync(dest)) {
    console.log(`yt-dlp already present at ${dest}, skipping download`)
    return
  }

  console.log(`Downloading yt-dlp for ${platform}...`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download yt-dlp: ${response.status} ${response.statusText}`)
  }

  const fileStream = createWriteStream(dest)
  await pipeline(response.body, fileStream)

  if (platform !== 'win32') {
    chmodSync(dest, 0o755)
  }

  console.log(`yt-dlp downloaded to ${dest}`)
}

downloadYtDlp().catch((err) => {
  console.error('Failed to download yt-dlp:', err)
  process.exit(1)
})
