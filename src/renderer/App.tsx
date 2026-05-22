import React, { useCallback, useRef, useState } from 'react';
import Titlebar from './components/Titlebar';
import TabStrip from './components/TabStrip';
import Omnibox from './components/Omnibox';
import WebViewTab from './components/WebViewTab';

let tabIdCounter = 0;
function generateTabId(): string {
  tabIdCounter++;
  return `tab-${Date.now()}-${tabIdCounter}`;
}

interface TabData {
  id: string;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  pinned: boolean;
  active: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

function createTab(url: string = 'about:blank'): TabData {
  return {
    id: generateTabId(),
    url,
    title: 'New Tab',
    favicon: '',
    loading: false,
    pinned: false,
    active: false,
    canGoBack: false,
    canGoForward: false,
  };
}

import { WebViewHandle } from '../shared/types';

export default function App() {
  const [tabs, setTabs] = useState<TabData[]>([{ ...createTab(), active: true }]);
  const webviewRefs = useRef<Map<string, WebViewHandle>>(new Map());
  const activeTab = tabs.find((t) => t.active) || tabs[0];

  const registerWebView = useCallback((tabId: string, handle: WebViewHandle) => {
    webviewRefs.current.set(tabId, handle);
  }, []);

  const unregisterWebView = useCallback((tabId: string) => {
    webviewRefs.current.delete(tabId);
  }, []);

  const withActiveWebView = useCallback((fn: (wv: WebViewHandle) => void) => {
    const active = tabs.find((t) => t.active);
    if (active) {
      const wv = webviewRefs.current.get(active.id);
      if (wv) fn(wv);
    }
  }, [tabs]);

  const updateTab = useCallback((tabId: string, partial: Partial<TabData>) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, ...partial } : t)));
  }, []);

  const selectTab = useCallback((tabId: string) => {
    setTabs((prev) => prev.map((t) => ({ ...t, active: t.id === tabId })));
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const filtered = prev.filter((t) => t.id !== tabId);
      unregisterWebView(tabId);
      if (filtered.length === 0) {
        const newTab = { ...createTab(), active: true };
        return [newTab];
      }
      if (prev.find((t) => t.id === tabId)?.active) {
        const newIdx = Math.min(idx, filtered.length - 1);
        filtered[newIdx] = { ...filtered[newIdx], active: true };
      }
      return filtered;
    });
  }, [unregisterWebView]);

  const newTab = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => ({ ...t, active: false })).concat({ ...createTab(), active: true }),
    );
  }, []);

  const handleNavigate = useCallback((url: string) => {
    withActiveWebView((wv) => wv.loadURL(url));
  }, [withActiveWebView]);

  const handleGoBack = useCallback(() => {
    withActiveWebView((wv) => wv.goBack());
  }, [withActiveWebView]);

  const handleGoForward = useCallback(() => {
    withActiveWebView((wv) => wv.goForward());
  }, [withActiveWebView]);

  const handleReload = useCallback(() => {
    withActiveWebView((wv) => wv.reload());
  }, [withActiveWebView]);

  const handleStop = useCallback(() => {
    withActiveWebView((wv) => wv.stop());
  }, [withActiveWebView]);

  const handleUrlChange = useCallback(
    (tabId: string, url: string) => updateTab(tabId, { url }),
    [updateTab],
  );

  const handleTitleChange = useCallback(
    (tabId: string, title: string) => updateTab(tabId, { title }),
    [updateTab],
  );

  const handleLoadingChange = useCallback(
    (tabId: string, loading: boolean) => updateTab(tabId, { loading }),
    [updateTab],
  );

  const handleFaviconChange = useCallback(
    (tabId: string, favicon: string) => updateTab(tabId, { favicon }),
    [updateTab],
  );

  const handleNavStateChange = useCallback(
    (tabId: string, canGoBack: boolean, canGoForward: boolean) => {
      updateTab(tabId, { canGoBack, canGoForward });
    },
    [updateTab],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Titlebar>
        <TabStrip tabs={tabs} onSelect={selectTab} onClose={closeTab} onNewTab={newTab} />
      </Titlebar>
      <Omnibox
        url={activeTab?.url || ''}
        loading={activeTab?.loading || false}
        canGoBack={activeTab?.canGoBack || false}
        canGoForward={activeTab?.canGoForward || false}
        onNavigate={handleNavigate}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onStop={handleStop}
      />
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {tabs.map((tab) => (
          <WebViewTab
            key={tab.id}
            tabId={tab.id}
            active={tab.active}
            url={tab.url}
            onUrlChange={handleUrlChange}
            onTitleChange={handleTitleChange}
            onLoadingChange={handleLoadingChange}
            onFaviconChange={handleFaviconChange}
            onNavStateChange={handleNavStateChange}
            onRegister={registerWebView}
            onUnregister={unregisterWebView}
          />
        ))}
      </div>
    </div>
  );
}
