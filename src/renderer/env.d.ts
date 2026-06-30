interface SessionTab {
  url: string;
  title: string;
  pinned: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  enabled: boolean;
  enableTools: boolean;
}

interface ShortcutEntry {
  id: string;
  label: string;
  keys: string[];
  action: string;
  enabled: boolean;
}

interface ExtensionEntry {
  path: string;
  name: string;
  enabled: boolean;
}

interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  encryptionPassword: string;
  lastSyncedAt: string | null;
}

interface PremiumConfig {
  enabled: boolean;
  licenseKey: string;
  activatedAt: string | null;
}

interface AppSettings {
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

interface PwaApp {
  id: string;
  name: string;
  description?: string;
  startUrl: string;
  manifestUrl: string;
  icon?: string;
  display: string;
  installedAt: string;
}

interface Database {
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

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  sessionLoad: () => Promise<{ tabs: SessionTab[]; activeIndex: number } | null>;
  sessionSave: (data: { tabs: SessionTab[]; activeIndex: number }) => void;
  onSessionSaveBeforeQuit: (callback: () => void) => void;
  onTabUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => void;
  onTabTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => void;
  onTabLoadingChanged: (callback: (data: { tabId: string; loading: boolean }) => void) => void;
  onTabFaviconChanged: (callback: (data: { tabId: string; favicon: string }) => void) => void;
  navigateToUrl: (url: string) => void;
  bangResolve: (query: string) => Promise<string | null>;

  dbLoad: () => Promise<Database>;
  dbSave: (data: Database) => void;

  extensionLoad: (extPath: string) => Promise<{ success: boolean; name?: string; id?: string; error?: string }>;
  extensionRemove: (extensionId: string) => Promise<{ success: boolean; error?: string }>;
  extensionList: () => Promise<{ id: string; name: string; path: string }[]>;

  ollamaFetchModels: (endpoint: string, apiKey?: string) => Promise<{ success: boolean; models?: OllamaModel[]; error?: string }>;
  ollamaChat: (params: {
    endpoint: string;
    apiKey?: string;
    model: string;
    messages: { role: string; content: string }[];
    temperature: number;
  }) => Promise<{ success: boolean; response?: string; error?: string }>;

  exportConversations: (data: { conversations: Conversation[]; tasks: Task[] }) => Promise<{ success: boolean; error?: string }>;
  importConversations: () => Promise<{ success: boolean; error?: string; data?: { conversations: Conversation[]; tasks: Task[] } | null }>;

  toolSearchWeb: (query: string) => Promise<{ success: boolean; results?: string; error?: string }>;

  pwaDetect: (manifestUrl: string) => Promise<{ success: boolean; app?: { name: string; description?: string; startUrl: string; icon?: string; display: string }; error?: string }>;
  pwaInstall: (app: unknown) => Promise<{ success: boolean; error?: string }>;
  pwaLaunch: (app: unknown) => Promise<{ success: boolean; error?: string }>;
  pwaUninstall: (appId: string) => Promise<{ success: boolean; error?: string }>;

  syncPush: (params: { data: string; serverUrl: string; password: string; apiKey: string }) => Promise<{ success: boolean; error?: string }>;
  syncPull: (params: { serverUrl: string; password: string; apiKey: string }) => Promise<{ success: boolean; data?: string; error?: string }>;
  syncTest: (params: { serverUrl: string; apiKey: string }) => Promise<{ success: boolean; error?: string }>;

  checkForUpdates: () => Promise<{ success: boolean; latestVersion?: string; downloadUrl?: string; releaseNotes?: string; publishedAt?: string; error?: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}

declare namespace Electron {
  interface WebviewTag extends HTMLElement {
    src: string;
    loadURL(url: string): Promise<void>;
    goBack(): void;
    goForward(): void;
    reload(): void;
    stop(): void;
    executeJavaScript(code: string): Promise<any>;
    getWebContentsId(): number;
    addEventListener(event: string, listener: (...args: any[]) => void): void;
    removeEventListener(event: string, listener: (...args: any[]) => void): void;
  }

  interface DidNavigateEvent { url: string; }
  interface DidNavigateInPageEvent { url: string; isMainFrame: boolean; }
  interface PageTitleUpdatedEvent { title: string; }
  interface PageFaviconUpdatedEvent { favicons: string[]; }
  interface UpdateTargetUrlEvent { url: string; }
  interface DidFailLoadEvent { errorCode: number; errorDescription: string; validatedURL: string; }
}

declare module '@mozilla/readability/JSDOMParser' {
  const JSDOMParser: {
    new (): {
      parse(html: string): Document | null;
    };
  };
  export default JSDOMParser;
}
