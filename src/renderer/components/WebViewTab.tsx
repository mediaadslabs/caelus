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
  onStatusUpdate,
}: WebViewTabProps) {
  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const [attached, setAttached] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);

  const setRef = useCallback((el: HTMLWebViewElement | null) => {
    if (el) {
      webviewRef.current = el as unknown as Electron.WebviewTag;
    }
  }, []);

  const loadURL = useCallback((u: string) => {
    const wv = webviewRef.current;
    if (!wv || !attached) {
      pendingUrlRef.current = u;
      return;
    }
    if (u === 'about:blank') return;
    wv.loadURL(u).catch((err: Error) => {
      console.error('webview.loadURL error:', err.message);
    });
  }, [attached]);

  const handle: WebViewHandle = {
    goBack: () => webviewRef.current?.goBack(),
    goForward: () => webviewRef.current?.goForward(),
    reload: () => webviewRef.current?.reload(),
    stop: () => webviewRef.current?.stop(),
    loadURL,
  };

  handleRefMap.set(tabId, handle);

  useEffect(() => {
    if (attached && pendingUrlRef.current) {
      const u = pendingUrlRef.current;
      pendingUrlRef.current = null;
      loadURL(u);
    }
  }, [attached, loadURL]);

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
    const onDidFailLoad = (e: Electron.DidFailLoadEvent) => {
      if (e.errorCode !== -3) {
        console.warn(`WebView[${tabId}] fail: ${e.errorDescription} (${e.errorCode}) for ${e.validatedURL}`);
      }
    };

    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigateInPage);
    wv.addEventListener('page-title-updated', onPageTitleUpdated);
    wv.addEventListener('did-start-loading', onDidStartLoading);
    wv.addEventListener('did-stop-loading', onDidStopLoading);
    wv.addEventListener('page-favicon-updated', onPageFaviconUpdated);
    wv.addEventListener('update-target-url', onUpdateTargetUrl);
    wv.addEventListener('did-fail-load', onDidFailLoad);

    return () => {
      wv.removeEventListener('did-navigate', onDidNavigate);
      wv.removeEventListener('did-navigate-in-page', onDidNavigateInPage);
      wv.removeEventListener('page-title-updated', onPageTitleUpdated);
      wv.removeEventListener('did-start-loading', onDidStartLoading);
      wv.removeEventListener('did-stop-loading', onDidStopLoading);
      wv.removeEventListener('page-favicon-updated', onPageFaviconUpdated);
      wv.removeEventListener('update-target-url', onUpdateTargetUrl);
      wv.removeEventListener('did-fail-load', onDidFailLoad);
    };
  }, [tabId, onUrlChange, onTitleChange, onLoadingChange, onFaviconChange, onStatusUpdate]);

  return (
    <webview
      ref={setRef}
      src={url || 'about:blank'}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
      }}
      onDid-attach={() => setAttached(true)}
      allowpopups
      webpreferences="contextIsolation=yes, nodeIntegration=no, webSecurity=no"
    />
  );
}
