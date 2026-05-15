const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true, // Cache le menu en haut pour faire plus "logiciel"
    
    // 👇 LA MODIFICATION EST ICI : .png devient .ico
    icon: path.join(__dirname, '../public/logo.ico'), 
    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // MISE À JOUR DU PORT VITE (5173)
    win.loadURL('http://localhost:5173'); 
  } else {
    // CORRECTION DU CHEMIN VERS L'INTERFACE COMPILÉE
    win.loadFile(path.join(__dirname, '../dist/index.html')); 
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});