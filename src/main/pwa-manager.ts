import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import type { PwaApp } from '../shared/types';

const pwaWindows = new Map<string, BrowserWindow>();

const isDev = !app.isPackaged;

export async function detectPwa(manifestUrl: string): Promise<{
  success: boolean;
  app?: { name: string; description?: string; startUrl: string; icon?: string; display: string };
  error?: string;
}> {
  try {
    const res = await fetch(manifestUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const manifest = await res.json();
    if (!manifest.name && !manifest.short_name) {
      return { success: false, error: 'No name in manifest' };
    }
    const name = manifest.name || manifest.short_name;
    const startUrl = manifest.start_url || '/';
    const display = manifest.display || 'browser';
    let icon: string | undefined;
    if (manifest.icons && manifest.icons.length > 0) {
      const best = manifest.icons.sort((a: any, b: any) => (b.sizes || '0x0').split('x')[0] - (a.sizes || '0x0').split('x')[0])[0];
      if (best.src) {
        const base = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
        icon = best.src.startsWith('http') ? best.src : new URL(best.src, base).href;
      }
    }
    return {
      success: true,
      app: { name, description: manifest.description, startUrl, icon, display },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export function launchPwa(appInfo: PwaApp): void {
  if (pwaWindows.has(appInfo.id)) {
    const existing = pwaWindows.get(appInfo.id);
    if (existing && !existing.isDestroyed()) {
      existing.focus();
      return;
    }
    pwaWindows.delete(appInfo.id);
  }

  const pwaWin = new BrowserWindow({
    width: 1024,
    height: 768,
    title: appInfo.name,
    icon: appInfo.icon || undefined,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  if (isDev) {
    pwaWin.loadURL(appInfo.startUrl.startsWith('http') ? appInfo.startUrl : `http://localhost:5173${appInfo.startUrl}`).catch(() => {});
  } else {
    pwaWin.loadURL(appInfo.startUrl).catch(() => {});
  }

  pwaWin.on('closed', () => {
    pwaWindows.delete(appInfo.id);
  });

  pwaWindows.set(appInfo.id, pwaWin);
}

export function closeAllPwaWindows(): void {
  for (const [id, win] of pwaWindows) {
    if (!win.isDestroyed()) win.close();
    pwaWindows.delete(id);
  }
}
