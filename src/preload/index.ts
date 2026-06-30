import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type { Conversation, Task } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),

  sessionLoad: () => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LOAD),
  sessionSave: (data: { tabs: { url: string; title: string; pinned: boolean }[]; activeIndex: number }) =>
    ipcRenderer.send(IPC_CHANNELS.SESSION_SAVE, data),
  onSessionSaveBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('session:save-before-quit', () => callback());
  },

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

  dbLoad: () => ipcRenderer.invoke(IPC_CHANNELS.DB_LOAD),
  dbSave: (data: unknown) => ipcRenderer.send(IPC_CHANNELS.DB_SAVE, data),

  extensionLoad: (extPath: string) => ipcRenderer.invoke(IPC_CHANNELS.EXTENSION_LOAD, extPath),
  extensionRemove: (extensionId: string) => ipcRenderer.invoke(IPC_CHANNELS.EXTENSION_REMOVE, extensionId),
  extensionList: () => ipcRenderer.invoke(IPC_CHANNELS.EXTENSION_LIST),

  ollamaFetchModels: (endpoint: string, apiKey?: string) => ipcRenderer.invoke(IPC_CHANNELS.OLLAMA_FETCH_MODELS, endpoint, apiKey),
  ollamaChat: (params: { endpoint: string; apiKey?: string; model: string; messages: { role: string; content: string }[]; temperature: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.OLLAMA_CHAT, params),

  exportConversations: (data: { conversations: Conversation[]; tasks: Task[] }) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_CONVERSATIONS, data),
  importConversations: () =>
    ipcRenderer.invoke(IPC_CHANNELS.IMPORT_CONVERSATIONS),

  toolSearchWeb: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.TOOL_SEARCH_WEB, query),

  pwaDetect: (manifestUrl: string) => ipcRenderer.invoke(IPC_CHANNELS.PWA_DETECT, manifestUrl),
  pwaInstall: (app: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PWA_INSTALL, app),
  pwaLaunch: (app: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PWA_LAUNCH, app),
  pwaUninstall: (appId: string) => ipcRenderer.invoke(IPC_CHANNELS.PWA_UNINSTALL, appId),

  syncPush: (params: { data: string; serverUrl: string; password: string; apiKey: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYNC_PUSH, params),
  syncPull: (params: { serverUrl: string; password: string; apiKey: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYNC_PULL, params),
  syncTest: (params: { serverUrl: string; apiKey: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYNC_TEST, params),

  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK),
});
