// Electron main process - CommonJS compatible
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getScanner } from './ble/scanner';
import { setupScanIPC } from './ipc/scanner-ipc';
import { setupGattIPC } from './ipc/gatt-ipc';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'BLE Scanner Pro',
    darkTheme: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const win = createWindow();
  await setupScanIPC(win!);
  await setupGattIPC(win!);
  win!.loadURL('http://localhost:3000');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
