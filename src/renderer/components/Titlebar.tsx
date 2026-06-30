import React from 'react';

function TrafficLightButtons() {
  const api = window.electronAPI;

  return (
    <div style={{ display: 'flex', gap: 8, paddingLeft: 12, WebkitAppRegion: 'no-drag' } as any}>
      <button
        style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ff5f57', WebkitAppRegion: 'no-drag' } as any}
        onClick={() => api?.close()}
        title="Close"
      />
      <button
        style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#febc2e', WebkitAppRegion: 'no-drag' } as any}
        onClick={() => api?.minimize()}
        title="Minimize"
      />
      <button
        style={{ width: 12, height: 12, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#28c840', WebkitAppRegion: 'no-drag' } as any}
        onClick={() => api?.maximize()}
        title="Maximize"
      />
    </div>
  );
}

function WindowControls() {
  const api = window.electronAPI;

  return (
    <div style={{ display: 'flex' }}>
      <button
        style={{ width: 46, height: 'var(--titlebar-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 10, transition: 'background var(--transition)' } as any}
        onClick={() => api?.minimize()}
        title="Minimize"
      >─</button>
      <button
        style={{ width: 46, height: 'var(--titlebar-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 10, transition: 'background var(--transition)' } as any}
        onClick={() => api?.maximize()}
        title="Maximize"
      >□</button>
      <button
        style={{ width: 46, height: 'var(--titlebar-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, transition: 'background var(--transition)', color: 'var(--text-secondary)' } as any}
        onClick={() => api?.close()}
        title="Close"
      >✕</button>
    </div>
  );
}

interface TitlebarProps {
  children?: React.ReactNode;
}

export default function Titlebar({ children }: TitlebarProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div style={{ height: 'var(--titlebar-height)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexShrink: 0, WebkitAppRegion: 'drag' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, WebkitAppRegion: 'no-drag' } as any}>
        {isMac && <TrafficLightButtons />}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', WebkitAppRegion: 'no-drag' } as any}>
        {children}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' } as any}>{!isMac && <WindowControls />}</div>
    </div>
  );
}
