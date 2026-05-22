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
}
