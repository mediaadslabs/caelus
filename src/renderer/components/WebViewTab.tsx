import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebViewHandle } from '../../shared/types';
import ContextMenu from './ContextMenu';

interface ContextMenuState {
  x: number;
  y: number;
  visible: boolean;
}

interface WebViewTabProps {
  tabId: string;
  active: boolean;
  url: string;
  onUrlChange: (tabId: string, url: string) => void;
  onTitleChange: (tabId: string, title: string) => void;
  onLoadingChange: (tabId: string, loading: boolean) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onStatusUpdate?: (text: string) => void;
  onContextAction?: (tabId: string, action: string, content: string) => void;
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
  onContextAction,
}: WebViewTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wvRef = useRef<Electron.WebviewTag | null>(null);
  const attachedRef = useRef(false);
  const pendingUrlRef = useRef<string | null>(null);
  const tabIdRef = useRef(tabId);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false });

  tabIdRef.current = tabId;

  const loadURL = useCallback((u: string) => {
    const wv = wvRef.current;
    if (!wv || !attachedRef.current) {
      pendingUrlRef.current = u;
      return;
    }
    if (u === 'about:blank') return;
    wv.loadURL(u).catch((err: Error) => {
      if (err.message.includes('ERR_ABORTED')) return;
      console.error('webview.loadURL error:', err.message);
    });
  }, []);

  const handle: WebViewHandle = {
    goBack: () => wvRef.current?.goBack(),
    goForward: () => wvRef.current?.goForward(),
    reload: () => wvRef.current?.reload(),
    stop: () => wvRef.current?.stop(),
    loadURL,
    executeJavaScript: (code: string) => {
      const wv = wvRef.current;
      if (!wv) return Promise.reject(new Error('WebView not attached'));
      return wv.executeJavaScript(code);
    },
  };

  handleRefMap.set(tabId, handle);

  const handleContextAction = useCallback(async (action: string) => {
    if (!onContextAction) return;
    const wv = wvRef.current;
    if (!wv || !attachedRef.current) return;
    const js = `
      (function() {
        var sel = window.getSelection().toString();
        if (sel) return sel.substring(0, 4000);
        var selectors = ['article','main','.content','#content','.post','.entry'];
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el) return el.innerText.substring(0, 4000);
        }
        return document.body.innerText.substring(0, 4000);
      })()
    `;
    try {
      const content: string = await wv.executeJavaScript(js);
      onContextAction(tabIdRef.current, action, content || '');
    } catch {
      onContextAction(tabIdRef.current, action, '(could not extract page content)');
    }
  }, [onContextAction]);

  useEffect(() => {
    if (active && wvRef.current) {
      wvRef.current.focus();
    }
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wv = document.createElement('webview') as Electron.WebviewTag;
    wv.setAttribute('src', url || 'about:blank');
    wv.setAttribute('allowpopups', '');
    wv.setAttribute('webpreferences', 'contextIsolation=yes, nodeIntegration=no, webSecurity=no');

    wv.style.cssText = `
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      border: none;
    `;

    container.appendChild(wv);
    wvRef.current = wv;

    const onAttach = () => {
      attachedRef.current = true;
      const pending = pendingUrlRef.current;
      if (pending) {
        pendingUrlRef.current = null;
        wv.loadURL(pending).catch((e: Error) => {
          if (e.message.includes('ERR_ABORTED')) return;
          console.error('pending loadURL:', e.message);
        });
      }
    };

    const onDidNavigate = (e: Electron.DidNavigateEvent) => onUrlChange(tabIdRef.current, e.url);
    const onDidNavigateInPage = (e: Electron.DidNavigateInPageEvent) => {
      if (e.isMainFrame) onUrlChange(tabIdRef.current, e.url);
    };
    const onPageTitleUpdated = (e: Electron.PageTitleUpdatedEvent) => onTitleChange(tabIdRef.current, e.title);
    const onDidStartLoading = () => onLoadingChange(tabIdRef.current, true);
    const onDidStopLoading = () => onLoadingChange(tabIdRef.current, false);
    const onPageFaviconUpdated = (e: Electron.PageFaviconUpdatedEvent) => {
      if (e.favicons.length > 0) onFaviconChange(tabIdRef.current, e.favicons[0]);
    };
    const onUpdateTargetUrl = (e: Electron.UpdateTargetUrlEvent) => {
      onStatusUpdate?.(e.url);
    };
    const onDidFailLoad = (e: Electron.DidFailLoadEvent) => {
      if (e.errorCode !== -3) {
        console.warn(`WebView[${tabIdRef.current}] fail: ${e.errorDescription} (${e.errorCode}) for ${e.validatedURL}`);
      }
    };

    const onContextMenuEvent = (e: any) => {
      e.preventDefault();
      setCtxMenu({ x: e.params.x, y: e.params.y, visible: true });
    };

    wv.addEventListener('did-attach', onAttach);
    wv.addEventListener('did-navigate', onDidNavigate);
    wv.addEventListener('did-navigate-in-page', onDidNavigateInPage);
    wv.addEventListener('page-title-updated', onPageTitleUpdated);
    wv.addEventListener('did-start-loading', onDidStartLoading);
    wv.addEventListener('did-stop-loading', onDidStopLoading);
    wv.addEventListener('page-favicon-updated', onPageFaviconUpdated);
    wv.addEventListener('update-target-url', onUpdateTargetUrl);
    wv.addEventListener('did-fail-load', onDidFailLoad);
    wv.addEventListener('context-menu', onContextMenuEvent);

    return () => {
      wv.removeEventListener('did-attach', onAttach);
      wv.removeEventListener('did-navigate', onDidNavigate);
      wv.removeEventListener('did-navigate-in-page', onDidNavigateInPage);
      wv.removeEventListener('page-title-updated', onPageTitleUpdated);
      wv.removeEventListener('did-start-loading', onDidStartLoading);
      wv.removeEventListener('did-stop-loading', onDidStopLoading);
      wv.removeEventListener('page-favicon-updated', onPageFaviconUpdated);
      wv.removeEventListener('update-target-url', onUpdateTargetUrl);
      wv.removeEventListener('did-fail-load', onDidFailLoad);
      wv.removeEventListener('context-menu', onContextMenuEvent);

      wv.remove();
      wvRef.current = null;
      attachedRef.current = false;
      handleRefMap.delete(tabId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
      }}
    >
      {ctxMenu.visible && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={[
            { label: 'Explain this page', action: 'explain' },
            { label: 'Summarize this page', action: 'summarize' },
            { label: 'Translate to English', action: 'translate' },
          ]}
          onSelect={handleContextAction}
          onClose={() => setCtxMenu((prev) => ({ ...prev, visible: false }))}
        />
      )}
    </div>
  );
}
