import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WebViewHandle } from '../../shared/types';

interface WebViewTabProps {
  tabId: string;
  active: boolean;
  url: string;
  onUrlChange: (tabId: string, url: string) => void;
  onTitleChange: (tabId: string, title: string) => void;
  onLoadingChange: (tabId: string, loading: boolean) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onRegister: (tabId: string, handle: WebViewHandle) => void;
  onUnregister: (tabId: string) => void;
  onStatusUpdate?: (text: string) => void;
}

const handleRefMap = new Map<string, WebViewHandle>();

export function getWebViewHandle(tabId: string): WebViewHandle | undefined {
  return handleRefMap.get(tabId);
}

export default function WebViewTab({
  tabId,
  active,
  url,
  onUrlChange,
  onTitleChange,
  onLoadingChange,
  onFaviconChange,
  onRegister,
  onUnregister,
  onStatusUpdate,
}: WebViewTabProps) {
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const [ready, setReady] = useState(false);

  const setRef = useCallback((el: HTMLWebViewElement | null) => {
    if (el) {
      webviewRef.current = el as unknown as Electron.WebviewTag;
    }
  }, []);

  const handle: WebViewHandle = {
    goBack: () => webviewRef.current?.goBack(),
    goForward: () => webviewRef.current?.goForward(),
    reload: () => webviewRef.current?.reload(),
    stop: () => webviewRef.current?.stop(),
    loadURL: (u: string) => {
      if (webviewRef.current && u !== 'about:blank') {
        webviewRef.current.loadURL(u);
      }
    },
  };

  handleRefMap.set(tabId, handle);

  useEffect(() => {
    onRegister(tabId, handle);
    return () => {
      onUnregister(tabId);
      handleRefMap.delete(tabId);
    };
  }, [tabId]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onDidNavigate = (e: Electron.DidNavigateEvent) => onUrlChange(tabId, e.url);
    const onDidNavigateInPage = (e: Electron.DidNavigateInPageEvent) => {
      if (e.isMainFrame) onUrlChange(tabId, e.url);
    };
    const onPageTitleUpdated = (e: Electron.PageTitleUpdatedEvent) => onTitleChange(tabId, e.title);
    const onDidStartLoading = () => onLoadingChange(tabId, true);
    const onDidStopLoading = () => onLoadingChange(tabId, false);
    const onPageFaviconUpdated = (e: Electron.PageFaviconUpdatedEvent) => {
      if (e.favicons.length > 0) onFaviconChange(tabId, e.favicons[0]);
    };
    const onUpdateTargetUrl = (e: Electron.UpdateTargetUrlEvent) => {
      onStatusUpdate?.(e.url);
    };

    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigateInPage);
    wv.addEventListener('page-title-updated', onPageTitleUpdated);
    wv.addEventListener('did-start-loading', onDidStartLoading);
    wv.addEventListener('did-stop-loading', onDidStopLoading);
    wv.addEventListener('page-favicon-updated', onPageFaviconUpdated);
    wv.addEventListener('update-target-url', onUpdateTargetUrl);

    return () => {
      wv.removeEventListener('did-navigate', onDidNavigate);
      wv.removeEventListener('did-navigate-in-page', onDidNavigateInPage);
      wv.removeEventListener('page-title-updated', onPageTitleUpdated);
      wv.removeEventListener('did-start-loading', onDidStartLoading);
      wv.removeEventListener('did-stop-loading', onDidStopLoading);
      wv.removeEventListener('page-favicon-updated', onPageFaviconUpdated);
      wv.removeEventListener('update-target-url', onUpdateTargetUrl);
    };
  }, [tabId, onUrlChange, onTitleChange, onLoadingChange, onFaviconChange, onStatusUpdate]);

  useEffect(() => {
    if (!ready) return;
    const wv = webviewRef.current;
    if (!wv) return;
    if (wv.getURL() !== url && url !== 'about:blank') {
      wv.loadURL(url);
    }
  }, [url, ready]);

  return (
    <webview
      ref={setRef}
      src={url || 'about:blank'}
      style={{
        width: '100%',
        height: '100%',
        display: active ? 'flex' : 'none',
      }}
      onDid-attach={() => setReady(true)}
      allowpopups
      webpreferences="contextIsolation=yes, nodeIntegration=no"
    />
  );
}
