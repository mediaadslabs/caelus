import React, { useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  action: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onSelect: (action: string) => void;
  onClose: () => void;
}

const menuStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1000,
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '4px 0',
  minWidth: 180,
};

const itemStyle: React.CSSProperties = {
  padding: '6px 16px',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

export default function ContextMenu({ x, y, items, onSelect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{ ...menuStyle, left: x, top: y }}>
      {items.map((item) => (
        <div
          key={item.action}
          style={itemStyle}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
          }}
          onClick={() => {
            onSelect(item.action);
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
