import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { saveSession, loadSession } from './session';
import { decodeLicenseKey } from '../shared/license';
import { loadDatabase, saveDatabase } from './database';
import { setupDownloadHandler } from './downloads';
import { resolveBangQuery } from './bangs';
import { setupAdBlocking } from './adblock';
import { detectPwa, launchPwa, closeAllPwaWindows } from './pwa-manager';
import { pushSync, pullSync, testConnection } from './sync';
import * as fs from 'fs';
import type { Database, Conversation, Task, PwaApp } from '../shared/types';

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
  closeAllPwaWindows();
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

ipcMain.handle(IPC_CHANNELS.DB_LOAD, () => {
  return loadDatabase();
});

ipcMain.on(IPC_CHANNELS.DB_SAVE, (_event, db: Database) => {
  saveDatabase(db);
});

ipcMain.handle(IPC_CHANNELS.EXTENSION_LOAD, async (_event, extPath: string) => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    const result = await mainWindow.webContents.session.loadExtension(extPath);
    return { success: true, name: result.name, id: result.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.EXTENSION_REMOVE, async (_event, extensionId: string) => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    await mainWindow.webContents.session.removeExtension(extensionId);
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.EXTENSION_LIST, () => {
  if (!mainWindow) return [];
  const exts = mainWindow.webContents.session.getAllExtensions();
  return exts.map((ext) => ({
    id: ext.id,
    name: ext.name,
    path: ext.path,
  }));
});

ipcMain.handle(IPC_CHANNELS.OLLAMA_FETCH_MODELS, async (_event, endpoint: string, apiKey?: string) => {
  try {
    const url = endpoint.replace(/\/+$/, '') + '/api/tags';
    const headers: Record<string, string> = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    console.log(`[Ollama] Fetching models from ${url}, hasApiKey: ${!!apiKey}`);
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[Ollama] Fetch models failed: ${res.status} ${res.statusText} - ${text.slice(0, 200)}`);
      return { success: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    return { success: true, models: data.models || [] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Ollama] Fetch models error: ${msg}`);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.EXPORT_CONVERSATIONS, async (_event, data: { conversations: Conversation[]; tasks: Task[] }) => {
  if (!mainWindow) return { success: false, error: 'No window' };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Conversations & Tasks',
    defaultPath: 'caelus-export.json',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
  });
  if (result.canceled || !result.filePath) return { success: false, error: 'Cancelled' };
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.IMPORT_CONVERSATIONS, async () => {
  if (!mainWindow) return { success: false, error: 'No window', data: null };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Conversations & Tasks',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Cancelled', data: null };
  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
    const data = JSON.parse(raw);
    return { success: true, data: { conversations: data.conversations || [], tasks: data.tasks || [] } };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg, data: null };
  }
});

ipcMain.handle(IPC_CHANNELS.PWA_DETECT, async (_event, manifestUrl: string) => {
  return detectPwa(manifestUrl);
});

ipcMain.handle(IPC_CHANNELS.PWA_INSTALL, async (_event, app: PwaApp) => {
  return { success: true };
});

ipcMain.handle(IPC_CHANNELS.PWA_LAUNCH, async (_event, app: PwaApp) => {
  launchPwa(app);
  return { success: true };
});

ipcMain.handle(IPC_CHANNELS.PWA_UNINSTALL, async (_event, _appId: string) => {
  return { success: true };
});

ipcMain.handle(IPC_CHANNELS.SYNC_PUSH, async (_event, { data, serverUrl, password, apiKey }: { data: string; serverUrl: string; password: string; apiKey: string }) => {
  return pushSync(data, serverUrl, password, apiKey);
});

ipcMain.handle(IPC_CHANNELS.SYNC_PULL, async (_event, { serverUrl, password, apiKey }: { serverUrl: string; password: string; apiKey: string }) => {
  return pullSync(serverUrl, password, apiKey);
});

ipcMain.handle(IPC_CHANNELS.SYNC_TEST, async (_event, { serverUrl, apiKey }: { serverUrl: string; apiKey: string }) => {
  return testConnection(serverUrl, apiKey);
});

ipcMain.handle(IPC_CHANNELS.LICENSE_VERIFY, (_event, licenseKey: string) => {
  return decodeLicenseKey(licenseKey);
});

ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
  try {
    const res = await fetch('https://api.github.com/repos/mediaadslabs/caelus/releases/latest', {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      success: true,
      latestVersion: (data.tag_name || data.name || '').replace(/^v/, ''),
      downloadUrl: data.html_url || '',
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.TOOL_SEARCH_WEB, async (_event, query: string) => {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const parts: string[] = [];
    if (data.AbstractText) {
      parts.push(`Summary: ${data.AbstractText} (Source: ${data.AbstractSource || 'DuckDuckGo'})`);
    }
    if (data.Answer) {
      parts.push(`Answer: ${data.Answer}`);
    }
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      const topics = data.RelatedTopics.slice(0, 8);
      for (const topic of topics) {
        if (topic.Text) {
          parts.push(`- ${topic.Text}`);
        } else if (topic.Topics) {
          for (const sub of topic.Topics.slice(0, 3)) {
            if (sub.Text) parts.push(`- ${sub.Text}`);
          }
        }
      }
    }
    const results = parts.length > 0 ? parts.join('\n') : `No instant results found for "${query}". Try a more specific query.`;
    return { success: true, results };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
});

ipcMain.handle(IPC_CHANNELS.OLLAMA_CHAT, async (_event, { endpoint, apiKey, model, messages, temperature }: {
  endpoint: string;
  apiKey?: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature: number;
}) => {
  try {
    const url = endpoint.replace(/\/+$/, '') + '/api/chat';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    console.log(`[Ollama] Chat with model ${model} at ${url}, hasApiKey: ${!!apiKey}`);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, stream: false, temperature }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[Ollama] Chat failed: ${res.status} ${res.statusText} - ${text.slice(0, 200)}`);
      return { success: false, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = await res.json();
    return { success: true, response: data.message?.content || '' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[Ollama] Chat error: ${msg}`);
    return { success: false, error: msg };
  }
});
