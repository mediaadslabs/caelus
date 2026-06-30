export interface TabState {
  id: string;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  pinned: boolean;
  active: boolean;
}

export interface BrowserWindowState {
  tabs: TabState[];
  activeTabId: string | null;
  layout: 'classic' | 'compact' | 'vertical';
  bookmarks: Bookmark[];
  showBookmarksBar: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
}

export interface BangEntry {
  s: string;
  ts: string[];
  u: string;
}

export type LayoutMode = 'classic' | 'compact' | 'vertical';

export interface WebViewHandle {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  stop: () => void;
  loadURL: (url: string) => void;
  executeJavaScript: (code: string) => Promise<any>;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  enabled: boolean;
  enableTools: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}

export interface ExtensionEntry {
  path: string;
  name: string;
  enabled: boolean;
}

export interface ShortcutEntry {
  id: string;
  label: string;
  keys: string[];
  action: string;
  enabled: boolean;
}

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  encryptionPassword: string;
  lastSyncedAt: string | null;
}

export interface PremiumConfig {
  enabled: boolean;
  licenseKey: string;
  activatedAt: string | null;
}

export interface AppSettings {
  ollamaEndpoint: string;
  ollamaApiKey: string;
  selectedModel: string;
  layout: string;
  showBookmarksBar: boolean;
  adBlocking: boolean;
  blockThirdPartyCookies: boolean;
  httpsEnforcement: boolean;
  defaultSearchEngine: string;
  enableBangs: boolean;
  theme: string;
  sync: SyncConfig;
  premium: PremiumConfig;
}

export interface Database {
  settings: AppSettings;
  agents: Agent[];
  extensions: ExtensionEntry[];
  session: {
    tabs: { url: string; title: string; pinned: boolean }[];
    activeIndex: number;
  };
  conversations: Conversation[];
  tasks: Task[];
  shortcuts: ShortcutEntry[];
  bookmarks: Bookmark[];
  installedApps: PwaApp[];
}

export interface PwaApp {
  id: string;
  name: string;
  description?: string;
  startUrl: string;
  manifestUrl: string;
  icon?: string;
  display: string;
  installedAt: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}
