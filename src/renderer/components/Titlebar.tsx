import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  titlebar: {
    height: 'var(--titlebar-height)',
    background: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)',
    WebkitAppRegion: 'drag' as any,
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-muted)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    WebkitAppRegion: 'no-drag' as any,
  },
  trafficLight: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag' as any,
  },
  windowBtn: {
    width: 46,
    height: 'var(--titlebar-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    fontSize: 10,
    transition: 'background var(--transition)',
  },
};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}

function TrafficLightButtons() {
  const api = window.electronAPI;

  return (
    <div style={{ display: 'flex', gap: 8, paddingLeft: 12, WebkitAppRegion: 'no-drag' as any }}>
      <button
        style={{ ...styles.trafficLight, background: '#ff5f57' }}
        onClick={() => api?.close()}
        title="Close"
      />
      <button
        style={{ ...styles.trafficLight, background: '#febc2e' }}
        onClick={() => api?.minimize()}
        title="Minimize"
      />
      <button
        style={{ ...styles.trafficLight, background: '#28c840' }}
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
      <button style={styles.windowBtn} onClick={() => api?.minimize()} title="Minimize">
        ─
      </button>
      <button style={styles.windowBtn} onClick={() => api?.maximize()} title="Maximize">
        □
      </button>
      <button
        style={{ ...styles.windowBtn, color: 'var(--text-secondary)' }}
        onClick={() => api?.close()}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
}

export default function Titlebar() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div style={styles.titlebar}>
      <div style={styles.left}>
        {isMac && <TrafficLightButtons />}
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1 }}>
          Helium Clone
        </span>
      </div>
      <div style={styles.center}>{/* Tab strip will go here */}</div>
      <div style={styles.right}>{!isMac && <WindowControls />}</div>
    </div>
  );
}
