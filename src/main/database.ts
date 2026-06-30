import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { Database, AppSettings, Agent, ExtensionEntry, ShortcutEntry, Bookmark, PwaApp } from '../shared/types';

const dbPath = path.join(app.getPath('userData'), 'database.json');

const defaultSettings: AppSettings = {
  ollamaEndpoint: 'http://localhost:11434',
  ollamaApiKey: '',
  selectedModel: '',
  layout: 'classic',
  showBookmarksBar: true,
  adBlocking: true,
  blockThirdPartyCookies: true,
  httpsEnforcement: true,
  defaultSearchEngine: 'duckduckgo',
  enableBangs: true,
  theme: 'dark-default',
  sync: {
    enabled: false,
    serverUrl: '',
    apiKey: '',
    encryptionPassword: '',
    lastSyncedAt: null,
  },
  premium: {
    enabled: false,
    licenseKey: '',
    activatedAt: null,
  },
};

const defaultShortcuts: ShortcutEntry[] = [
  { id: 'new-tab', label: 'New Tab', keys: ['Ctrl', 'T'], action: 'new-tab', enabled: true },
  { id: 'close-tab', label: 'Close Tab', keys: ['Ctrl', 'W'], action: 'close-tab', enabled: true },
  { id: 'toggle-split', label: 'Toggle Split View', keys: ['Ctrl', 'Shift', 'S'], action: 'toggle-split', enabled: true },
  { id: 'copy-url', label: 'Copy Current URL', keys: ['Ctrl', 'Shift', 'C'], action: 'copy-url', enabled: true },
  { id: 'focus-omnibox', label: 'Focus Address Bar', keys: ['Ctrl', 'L'], action: 'focus-omnibox', enabled: true },
];

function createDefaultDatabase(): Database {
  return {
    settings: { ...defaultSettings },
    agents: [],
    extensions: [],
    session: { tabs: [], activeIndex: 0 },
    conversations: [],
    tasks: [],
    shortcuts: defaultShortcuts.map((s) => ({ ...s })),
    bookmarks: [],
    installedApps: [],
  };
}

export function loadDatabase(): Database {
  try {
    if (!fs.existsSync(dbPath)) {
      const defaultDb = createDefaultDatabase();
      saveDatabase(defaultDb);
      return defaultDb;
    }
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw) as Database;
    return {
      settings: { ...defaultSettings, ...parsed.settings },
      agents: parsed.agents || [],
      extensions: parsed.extensions || [],
      session: parsed.session || { tabs: [], activeIndex: 0 },
      conversations: parsed.conversations || [],
      tasks: parsed.tasks || [],
      shortcuts: parsed.shortcuts || defaultShortcuts.map((s) => ({ ...s })),
      bookmarks: parsed.bookmarks || [],
      installedApps: parsed.installedApps || [],
    };
  } catch {
    const defaultDb = createDefaultDatabase();
    saveDatabase(defaultDb);
    return defaultDb;
  }
}

export function saveDatabase(db: Database): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    console.warn('Failed to save database');
  }
}

export function getDefaultSettings(): AppSettings {
  return { ...defaultSettings };
}
