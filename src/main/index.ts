import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { saveSession, loadSession } from './session';
import { setupDownloadHandler } from './downloads';
import { resolveBangQuery } from './bangs';
import { setupAdBlocking } from './adblock';

let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      webviewTag: true,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  setupDownloadHandler(mainWindow);
  setupAdBlocking(mainWindow.webContents.session);

  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(false);
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    if (responseHeaders['set-cookie']) {
      delete responseHeaders['set-cookie'];
    }
    callback({ responseHeaders });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  const wc = mainWindow?.webContents;
  if (wc && !wc.isDestroyed()) {
    wc.send('session:save-before-quit');
  }
});

ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
  mainWindow?.minimize();
});

ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
  mainWindow?.close();
});

ipcMain.handle(IPC_CHANNELS.SESSION_LOAD, () => {
  return loadSession();
});

ipcMain.on(IPC_CHANNELS.SESSION_SAVE, (_event, data: { tabs: { url: string; title: string; pinned: boolean }[]; activeIndex: number }) => {
  saveSession(data.tabs, data.activeIndex);
});

ipcMain.handle(IPC_CHANNELS.BANG_RESOLVE, (_event, query: string) => {
  return resolveBangQuery(query);
});
