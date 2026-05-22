import React, { useCallback, useRef, useState } from 'react';
import WebViewTab from './WebViewTab';
import type { WebViewHandle } from '../../shared/types';

interface SplitViewProps {
  tabs: { id: string; url: string }[];
  activeTabId: string;
  splitTabId: string | null;
  onUrlChange: (tabId: string, url: string) => void;
  onTitleChange: (tabId: string, title: string) => void;
  onLoadingChange: (tabId: string, loading: boolean) => void;
  onFaviconChange: (tabId: string, favicon: string) => void;
  onStatusUpdate: (text: string) => void;
  onCloseSplit: () => void;
  splitRatio: number;
  onSplitRatioChange: (ratio: number) => void;
}

export default function SplitView({
  tabs,
  activeTabId,
  splitTabId,
  onUrlChange,
  onTitleChange,
  onLoadingChange,
  onFaviconChange,
  onStatusUpdate,
  onCloseSplit,
  splitRatio,
  onSplitRatioChange,
}: SplitViewProps) {
  const dragging = useRef(false);

  const getTab = (id: string) => tabs.find((t) => t.id === id);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const container = document.getElementById('split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      onSplitRatioChange(Math.max(0.2, Math.min(0.8, ratio)));
    };
    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onSplitRatioChange]);

  const active = getTab(activeTabId);
  const split = splitTabId ? getTab(splitTabId) : null;

  if (!split || !active) {
    return null;
  }

  return (
    <div
      id="split-container"
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <div style={{ width: `${splitRatio * 100}%`, height: '100%', position: 'relative' }}>
        <WebViewTab
          tabId={active.id}
          active
          url={active.url}
          onUrlChange={onUrlChange}
          onTitleChange={onTitleChange}
          onLoadingChange={onLoadingChange}
          onFaviconChange={onFaviconChange}
          onStatusUpdate={onStatusUpdate}
        />
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          width: 4,
          cursor: 'col-resize',
          background: 'var(--border)',
          flexShrink: 0,
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--border)')}
      />

      <div style={{ flex: 1, height: '100%', position: 'relative' }}>
        <button
          onClick={onCloseSplit}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-surface)',
            color: 'var(--text-muted)',
            fontSize: 10,
            zIndex: 10,
            border: '1px solid var(--border)',
          }}
          title="Close split view"
        >
          ✕
        </button>
        <WebViewTab
          tabId={split.id}
          active
          url={split.url}
          onUrlChange={onUrlChange}
          onTitleChange={onTitleChange}
          onLoadingChange={onLoadingChange}
          onFaviconChange={onFaviconChange}
          onStatusUpdate={onStatusUpdate}
        />
      </div>
    </div>
  );
}
