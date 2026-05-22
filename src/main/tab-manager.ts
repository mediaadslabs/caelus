import { BrowserWindow, WebContents, webContents } from 'electron';
import { TabState } from '../shared/types';

let tabCounter = 0;

export function generateTabId(): string {
  tabCounter++;
  return `tab-${Date.now()}-${tabCounter}`;
}

export function createTabState(url: string = 'about:blank'): TabState {
  return {
    id: generateTabId(),
    url,
    title: 'New Tab',
    favicon: '',
    loading: false,
    pinned: false,
    active: false,
  };
}

const tabContentsMap = new Map<string, number>();

export function associateTabWithWebContents(tabId: string, webContentsId: number): void {
  tabContentsMap.set(tabId, webContentsId);
}

export function getWebContentsForTab(tabId: string): WebContents | undefined {
  const wcId = tabContentsMap.get(tabId);
  if (wcId === undefined) return undefined;
  return webContents.fromId(wcId);
}

export function removeTabMapping(tabId: string): void {
  tabContentsMap.delete(tabId);
}
