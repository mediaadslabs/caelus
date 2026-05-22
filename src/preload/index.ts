import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  onTabUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TAB_URL_CHANGED, (_event, data) => callback(data));
  },
  onTabTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TAB_TITLE_CHANGED, (_event, data) => callback(data));
  },
  onTabLoadingChanged: (callback: (data: { tabId: string; loading: boolean }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TAB_LOADING_CHANGED, (_event, data) => callback(data));
  },
  onTabFaviconChanged: (callback: (data: { tabId: string; favicon: string }) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TAB_FAVICON_CHANGED, (_event, data) => callback(data));
  },

  navigateToUrl: (url: string) => ipcRenderer.send(IPC_CHANNELS.NAVIGATE_TO_URL, url),
  bangResolve: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.BANG_RESOLVE, query),
});
