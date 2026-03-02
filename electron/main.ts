import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// On assigne les variables
process.env.DIST = path.join(__dirname, '../dist')
// On utilise `process.env.DIST!` pour affirmer à TypeScript que la variable n'est pas undefined
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST!, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    // On ajoute `!` pour garantir que VITE_PUBLIC est une string
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // On ajoute `!` pour garantir que DIST est une string
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(createWindow)