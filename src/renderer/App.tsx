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
import AgentPanel from './components/AgentPanel';
import WebViewTab, { getWebViewHandle } from './components/WebViewTab';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import { useShortcutManager } from './hooks/useShortcutManager';
import type { OmniboxHandle } from './components/Omnibox';
import { applyTheme } from './themes';
import { extractArticle, EXTRACT_HTML_SCRIPT } from './agents/reader';
import type { ArticleResult } from './agents/reader';
import ReaderView from './components/ReaderView';
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
  };
}

function BrowserContent() {
  const [tabs, setTabs] = useState<TabData[]>([{ ...createTab(), active: true }]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [statusText, setStatusText] = useState('');
  const [verticalCollapsed, setVerticalCollapsed] = useState(false);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [lastActiveTabId, setLastActiveTabId] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [readerArticle, setReaderArticle] = useState<ArticleResult | null>(null);
  const [contextAction, setContextAction] = useState<{ action: string; content: string } | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [pwaDetectedApp, setPwaDetectedApp] = useState<{ name: string; description?: string; startUrl: string; icon?: string; display: string; manifestUrl: string } | null>(null);
  const omniboxRef = useRef<OmniboxHandle>(null);
  const activeTab = tabs.find((t) => t.active) || tabs[0];
  const { mode, cycleMode } = useLayout();

  useEffect(() => {
    window.electronAPI?.dbLoad().then((data) => {
      setDb(data);
      if (data.settings.layout === 'vertical') {
      } else if (data.settings.layout === 'compact') {
      }
      setShowBookmarksBar(data.settings.showBookmarksBar);
      setBookmarks(data.bookmarks || []);
    });
  }, []);

  useEffect(() => {
    if (db?.settings.theme) {
      applyTheme(db.settings.theme);
    }
  }, [db?.settings.theme]);

  const handleDbSave = useCallback((newDb: Database) => {
    setDb(newDb);
    window.electronAPI?.dbSave(newDb);
    setShowBookmarksBar(newDb.settings.showBookmarksBar);
    setBookmarks(newDb.bookmarks || []);
  }, []);

  const withActiveWebView = useCallback((fn: (wv: WebViewHandle) => void) => {
    const active = tabs.find((t) => t.active);
    if (active) {
      const handle = getWebViewHandle(active.id);
      if (handle) fn(handle);
    }
  }, [tabs]);

  const updateTab = useCallback((tabId: string, partial: Partial<TabData>) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, ...partial } : t)));
  }, []);

  const selectTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      return prev.map((t) => ({ ...t, active: t.id === tabId }));
    });
    setLastActiveTabId((prev) => (prev !== tabId ? activeTab?.id || prev : prev));
    setSplitTabId((prev) => (prev === tabId ? null : prev));
  }, [activeTab]);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === tabId);
      const filtered = prev.filter((t) => t.id !== tabId);
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
  }, []);

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

  const isCurrentPageBookmarked = activeTab?.url && activeTab.url !== 'about:blank'
    ? bookmarks.some((b) => b.url === activeTab.url)
    : false;

  const handleToggleBookmark = useCallback(() => {
    const url = activeTab?.url;
    const title = activeTab?.title;
    if (!url || url === 'about:blank' || !title) return;
    const existing = bookmarks.find((b) => b.url === url);
    if (existing) {
      const newBookmarks = bookmarks.filter((b) => b.id !== existing.id);
      const newDb = db ? { ...db, bookmarks: newBookmarks } : null;
      if (newDb) handleDbSave(newDb);
    } else {
      const newBookmark: Bookmark = { id: crypto.randomUUID(), title, url };
      const newBookmarks = [...bookmarks, newBookmark];
      const newDb = db ? { ...db, bookmarks: newBookmarks } : null;
      if (newDb) handleDbSave(newDb);
    }
  }, [activeTab, bookmarks, db, handleDbSave]);

  const handleRemoveBookmark = useCallback((id: string) => {
    const newBookmarks = bookmarks.filter((b) => b.id !== id);
    const newDb = db ? { ...db, bookmarks: newBookmarks } : null;
    if (newDb) handleDbSave(newDb);
  }, [bookmarks, db, handleDbSave]);

  const handleUrlChange = useCallback((tabId: string, url: string) => updateTab(tabId, { url }), [updateTab]);
  const handleTitleChange = useCallback((tabId: string, title: string) => updateTab(tabId, { title }), [updateTab]);
  const handleLoadingChange = useCallback((tabId: string, loading: boolean) => updateTab(tabId, { loading }), [updateTab]);
  const handleFaviconChange = useCallback((tabId: string, favicon: string) => updateTab(tabId, { favicon }), [updateTab]);

  const toggleAgentPanel = useCallback(() => {
    setShowAgents((v) => !v);
  }, []);

  useEffect(() => {
    if (!activeTab?.url || activeTab.url === 'about:blank' || !activeTab.url.startsWith('http')) {
      setPwaDetectedApp(null);
      return;
    }
    const timer = setTimeout(async () => {
      const handle = getWebViewHandle(activeTab.id);
      if (!handle) return;
      try {
        const manifestUrl: string | null = await handle.executeJavaScript(`
          (function() {
            var link = document.querySelector('link[rel="manifest"]');
            if (!link) return null;
            var href = link.getAttribute('href');
            if (!href) return null;
            return new URL(href, document.baseURI).href;
          })()
        `);
        if (!manifestUrl) {
          setPwaDetectedApp(null);
          return;
        }
        const result = await window.electronAPI?.pwaDetect(manifestUrl);
        if (result?.success && result.app) {
          setPwaDetectedApp({ ...result.app, manifestUrl });
        } else {
          setPwaDetectedApp(null);
        }
      } catch {
        setPwaDetectedApp(null);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeTab?.id, activeTab?.url, getWebViewHandle]);

  const handleInstallPwa = useCallback(async () => {
    if (!pwaDetectedApp || !db) return;
    const newApp: PwaApp = {
      id: `pwa-${Date.now()}`,
      name: pwaDetectedApp.name,
      description: pwaDetectedApp.description,
      startUrl: pwaDetectedApp.startUrl.startsWith('http')
        ? pwaDetectedApp.startUrl
        : new URL(pwaDetectedApp.startUrl, activeTab?.url).href,
      manifestUrl: pwaDetectedApp.manifestUrl,
      icon: pwaDetectedApp.icon,
      display: pwaDetectedApp.display,
      installedAt: new Date().toISOString(),
    };
    await window.electronAPI?.pwaInstall(newApp);
    const newDb = { ...db, installedApps: [...(db.installedApps || []), newApp] };
    handleDbSave(newDb);
    setPwaDetectedApp(null);
  }, [pwaDetectedApp, db, handleDbSave, activeTab?.url]);

  const handleUninstallPwa = useCallback(async (appId: string) => {
    if (!db) return;
    await window.electronAPI?.pwaUninstall(appId);
    const newDb = { ...db, installedApps: (db.installedApps || []).filter((a) => a.id !== appId) };
    handleDbSave(newDb);
  }, [db, handleDbSave]);

  const handleLaunchPwa = useCallback(async (app: PwaApp) => {
    await window.electronAPI?.pwaLaunch(app);
  }, []);

  const handleContextAction = useCallback((_tabId: string, action: string, content: string) => {
    setContextAction({ action, content });
    setShowAgents(true);
  }, []);

  const toggleReaderMode = useCallback(async () => {
    if (readerArticle) {
      setReaderArticle(null);
      return;
    }
    const active = tabs.find((t) => t.active);
    if (!active) return;
    const handle = getWebViewHandle(active.id);
    if (!handle) return;
    try {
      const html = await handle.executeJavaScript(EXTRACT_HTML_SCRIPT);
      if (!html) return;
      const article = await extractArticle(html);
      if (article) {
        setReaderArticle(article);
      }
    } catch {}
  }, [readerArticle, tabs]);

  const activeTabId = tabs.find((t) => t.active)?.id;
  const handleCloseTab = useCallback(() => {
    if (activeTabId) closeTab(activeTabId);
  }, [activeTabId, closeTab]);

  const handleCopyUrl = useCallback(() => {
    const url = activeTab?.url;
    if (url && url !== 'about:blank') {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }, [activeTab?.url]);

  const handleFocusOmnibox = useCallback(() => {
    omniboxRef.current?.focus();
  }, []);

  useShortcutManager(db?.shortcuts || [], {
    'new-tab': newTab,
    'close-tab': handleCloseTab,
    'toggle-split': toggleSplit,
    'copy-url': handleCopyUrl,
    'focus-omnibox': handleFocusOmnibox,
  });

  const renderWebviewArea = () => {
    if (showSettings) {
      return <Settings onClose={() => setShowSettings(false)} db={db || { settings: { ollamaEndpoint: 'http://localhost:11434', ollamaApiKey: '', selectedModel: '', layout: 'classic', showBookmarksBar: true, adBlocking: true, blockThirdPartyCookies: true, httpsEnforcement: true, defaultSearchEngine: 'duckduckgo', enableBangs: true, theme: 'dark-default', sync: { enabled: false, serverUrl: '', apiKey: '', encryptionPassword: '', lastSyncedAt: null }, premium: { enabled: false, licenseKey: '', activatedAt: null } }, agents: [], extensions: [], session: { tabs: [], activeIndex: 0 }, conversations: [], tasks: [], shortcuts: [], bookmarks: [], installedApps: [] }} onSave={handleDbSave} onPwaLaunch={handleLaunchPwa} onPwaUninstall={handleUninstallPwa} />;
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
          onStatusUpdate={setStatusText}
          onCloseSplit={() => setSplitTabId(null)}
          splitRatio={splitRatio}
          onSplitRatioChange={setSplitRatio}
          onContextAction={handleContextAction}
        />
      );
    }

    return (
      <div style={{ flex: 1, position: 'relative', background: '#fff', overflow: 'hidden', display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative' }}>
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
              onStatusUpdate={setStatusText}
              onContextAction={handleContextAction}
            />
          ))}
          {isNewTab && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
              <NewTabPage onNavigate={handleNavigate} />
            </div>
          )}
          <StatusBar text={statusText} visible={!!statusText} />
          {readerArticle && (
            <ReaderView article={readerArticle} onClose={() => setReaderArticle(null)} />
          )}
        </div>
        {showAgents && db && (
          <AgentPanel db={db} onDbUpdate={handleDbSave} contextAction={contextAction} activeTabId={activeTab?.id} getWebViewHandle={getWebViewHandle} onClose={() => {
            setShowAgents(false);
            setContextAction(null);
          }} />
        )}
      </div>
    );
  };

  const omniboxContent = (
    <Omnibox
      ref={omniboxRef}
      url={activeTab?.url || ''}
      loading={activeTab?.loading || false}
      onNavigate={handleNavigate}
      onGoBack={handleGoBack}
      onGoForward={handleGoForward}
      onReload={handleReload}
      onStop={handleStop}
      onSplitToggle={toggleSplit}
      isSplit={!!(splitTabId && splitTabId !== activeTab?.id)}
      onSettingsToggle={() => setShowSettings((v) => !v)}
      onAgentToggle={toggleAgentPanel}
      isAgentOpen={showAgents}
      onReaderToggle={toggleReaderMode}
      isReaderActive={!!readerArticle}
      pwaApp={pwaDetectedApp}
      onPwaInstall={handleInstallPwa}
      isBookmarked={isCurrentPageBookmarked}
      onToggleBookmark={handleToggleBookmark}
    />
  );

  const bookmarksContent = (
    <BookmarksBar bookmarks={bookmarks} visible={showBookmarksBar} onBookmarkClick={handleBookmarkClick} onRemoveBookmark={handleRemoveBookmark} />
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
