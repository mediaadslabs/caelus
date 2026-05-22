import React from 'react';

interface StatusBarProps {
  text: string;
  visible: boolean;
}

export default function StatusBar({ text, visible }: StatusBarProps) {
  if (!visible || !text) return null;

  return (
    <div
      style={{
        height: 'var(--status-bar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--text-muted)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}
