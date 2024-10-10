const { app, BrowserWindow, ipcMain } = require('electron');
const { desktopCapturer } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  ipcMain.on('get-desktop-capturer', async (event) => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['window', 'screen'] });
      event.reply('desktop-capturer', sources);
    } catch (error) {
      console.error('Error getting sources:', error);
      event.reply('desktop-capturer', []);
    }
  });

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});