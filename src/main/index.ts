import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { download } from './downloader'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })


  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
    win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  const win = createWindow()

  ipcMain.handle('choose-folder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Choose download folder',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (canceled || filePaths.length === 0) return undefined
    return filePaths[0]
  })

  ipcMain.handle('download', async (_, url: string, browser: import('../shared/types').CookiesBrowser, dir: string) => {
    await download(url, browser, dir, (progress) => {
      win.webContents.send('download:progress', progress)
    })
  })

  ipcMain.handle('open-folder', (_, path: string) => shell.openPath(path))
  ipcMain.handle('show-item-in-folder', (_, path: string) => shell.showItemInFolder(path))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
