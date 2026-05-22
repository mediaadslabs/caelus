import React, { useCallback, useEffect, useRef, useState } from 'react';
import Titlebar from './components/Titlebar';
import TabStrip from './components/TabStrip';
import Omnibox from './components/Omnibox';
import BookmarksBar from './components/BookmarksBar';
import StatusBar from './components/StatusBar';
import VerticalTabs from './components/VerticalTabs';
import SplitView from './components/SplitView';
import NewTabPage from './components/NewTabPage';
import Settings from './components/Settings';
import WebViewTab from './components/WebViewTab';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { useQuickLinkCopy } from './hooks/useQuickLinkCopy';
import type { WebViewHandle, Bookmark } from '../shared/types';

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

function BrowserContent() {
  const [tabs, setTabs] = useState<TabData[]>([{ ...createTab(), active: true }]);
  const [bookmarks] = useState<Bookmark[]>([]);
  const [showBookmarksBar] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [verticalCollapsed, setVerticalCollapsed] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [lastActiveTabId, setLastActiveTabId] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const webviewRefs = useRef<Map<string, WebViewHandle>>(new Map());
  const activeTab = tabs.find((t) => t.active) || tabs[0];
  const { mode } = useLayout();

  useQuickLinkCopy(activeTab?.url || '');

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
    setTabs((prev) => {
      const oldActive = prev.find((t) => t.active);
      return prev.map((t) => ({ ...t, active: t.id === tabId }));
    });
    setLastActiveTabId((prev) => (prev !== tabId ? activeTab?.id || prev : prev));
    setSplitTabId((prev) => (prev === tabId ? null : prev));
  }, [activeTab]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const filtered = prev.filter((t) => t.id !== tabId);
      unregisterWebView(tabId);
      if (filtered.length === 0) return [{ ...createTab(), active: true }];
      if (prev.find((t) => t.id === tabId)?.active) {
        filtered[Math.min(idx, filtered.length - 1)] = {
          ...filtered[Math.min(idx, filtered.length - 1)],
          active: true,
        };
      }
      return filtered;
    });
    setSplitTabId((prev) => (prev === tabId ? null : prev));
  }, [unregisterWebView]);

  const newTab = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => ({ ...t, active: false })).concat({ ...createTab(), active: true }),
    );
  }, []);

  const toggleSplit = useCallback(() => {
    if (splitTabId) {
      setSplitTabId(null);
      return;
    }
    if (lastActiveTabId && lastActiveTabId !== activeTab?.id) {
      setSplitTabId(lastActiveTabId);
    } else {
      const otherTab = tabs.find((t) => t.id !== activeTab?.id && !t.pinned);
      if (otherTab) {
        setSplitTabId(otherTab.id);
      } else {
        const newId = generateTabId();
        const newTabData = { ...createTab(), id: newId, active: false };
        setTabs((prev) => [...prev, newTabData]);
        setSplitTabId(newId);
      }
    }
  }, [splitTabId, lastActiveTabId, activeTab, tabs]);

  const handleNavigate = useCallback((url: string) => withActiveWebView((wv) => wv.loadURL(url)), [withActiveWebView]);
  const handleGoBack = useCallback(() => withActiveWebView((wv) => wv.goBack()), [withActiveWebView]);
  const handleGoForward = useCallback(() => withActiveWebView((wv) => wv.goForward()), [withActiveWebView]);
  const handleReload = useCallback(() => withActiveWebView((wv) => wv.reload()), [withActiveWebView]);
  const handleStop = useCallback(() => withActiveWebView((wv) => wv.stop()), [withActiveWebView]);
  const handleBookmarkClick = useCallback((url: string) => withActiveWebView((wv) => wv.loadURL(url)), [withActiveWebView]);

  const handleUrlChange = useCallback((tabId: string, url: string) => updateTab(tabId, { url }), [updateTab]);
  const handleTitleChange = useCallback((tabId: string, title: string) => updateTab(tabId, { title }), [updateTab]);
  const handleLoadingChange = useCallback((tabId: string, loading: boolean) => updateTab(tabId, { loading }), [updateTab]);
  const handleFaviconChange = useCallback((tabId: string, favicon: string) => updateTab(tabId, { favicon }), [updateTab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        toggleSplit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSplit]);

  const renderWebviewArea = () => {
    if (showSettings) {
      return <Settings onClose={() => setShowSettings(false)} />;
    }

    const isNewTab = !activeTab?.url || activeTab.url === 'about:blank';
    const isSplit = splitTabId && splitTabId !== activeTab?.id && !isNewTab;

    if (isSplit && activeTab) {
      return (
        <SplitView
          tabs={tabs}
          activeTabId={activeTab.id}
          splitTabId={splitTabId}
          onUrlChange={handleUrlChange}
          onTitleChange={handleTitleChange}
          onLoadingChange={handleLoadingChange}
          onFaviconChange={handleFaviconChange}
          onRegister={registerWebView}
          onUnregister={unregisterWebView}
          onStatusUpdate={setStatusText}
          onCloseSplit={() => setSplitTabId(null)}
          splitRatio={splitRatio}
          onSplitRatioChange={setSplitRatio}
        />
      );
    }

    return (
      <div style={{ flex: 1, position: 'relative', background: '#fff', overflow: 'hidden' }}>
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
            onRegister={registerWebView}
            onUnregister={unregisterWebView}
            onStatusUpdate={setStatusText}
          />
        ))}
        {isNewTab && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
            <NewTabPage onNavigate={handleNavigate} />
          </div>
        )}
        <StatusBar text={statusText} visible={!!statusText} />
      </div>
    );
  };

  const omniboxContent = (
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
      onSplitToggle={toggleSplit}
      isSplit={!!(splitTabId && splitTabId !== activeTab?.id)}
      onSettingsToggle={() => setShowSettings((v) => !v)}
    />
  );

  const bookmarksContent = (
    <BookmarksBar bookmarks={bookmarks} visible={showBookmarksBar} onBookmarkClick={handleBookmarkClick} />
  );

  if (mode === 'vertical') {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <VerticalTabs
          tabs={tabs}
          onSelect={selectTab}
          onClose={closeTab}
          onNewTab={newTab}
          collapsed={verticalCollapsed}
          onToggleCollapse={() => setVerticalCollapsed((v) => !v)}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {omniboxContent}
          {bookmarksContent}
          {renderWebviewArea()}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Titlebar>
        <TabStrip tabs={tabs} onSelect={selectTab} onClose={closeTab} onNewTab={newTab} />
      </Titlebar>
      {omniboxContent}
      {bookmarksContent}
      {renderWebviewArea()}
    </div>
  );
}

export default function App() {
  return (
    <LayoutProvider>
      <BrowserContent />
    </LayoutProvider>
  );
}
