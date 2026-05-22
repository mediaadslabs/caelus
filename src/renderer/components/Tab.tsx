import React from 'react';

interface TabProps {
  id: string;
  title: string;
  favicon: string;
  loading: boolean;
  active: boolean;
  pinned: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

export default function Tab({
  id,
  title,
  favicon,
  loading,
  active,
  pinned,
  onSelect,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
}: TabProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => onDrop?.(e, id)}
      onClick={() => onSelect(id)}
      onMouseDown={(e) => {
        if (e.button === 1) onClose(id);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 'var(--tab-height)',
        padding: '0 8px',
        background: active ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        minWidth: pinned ? 32 : 60,
        maxWidth: 200,
        flexShrink: 0,
        fontSize: 'var(--font-size-sm)',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'background var(--transition), color var(--transition)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {loading ? (
        <span style={{ fontSize: 10, color: 'var(--accent)' }}>◌</span>
      ) : favicon ? (
        <img src={favicon} alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
      ) : (
        <span style={{ fontSize: 14 }}>{'🌐'}</span>
      )}
      {!pinned && (
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {title || 'New Tab'}
        </span>
      )}
      {!pinned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'var(--text-muted)',
            opacity: active ? 1 : 0,
            transition: 'opacity var(--transition), background var(--transition)',
            flexShrink: 0,
          }}
          className="tab-close-btn"
          title="Close tab"
        >
          ✕
        </button>
      )}
    </div>
  );
}
