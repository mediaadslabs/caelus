interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  onTabUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => void;
  onTabTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => void;
  onTabLoadingChanged: (callback: (data: { tabId: string; loading: boolean }) => void) => void;
  onTabFaviconChanged: (callback: (data: { tabId: string; favicon: string }) => void) => void;
  navigateToUrl: (url: string) => void;
  bangResolve: (query: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
