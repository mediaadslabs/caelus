import React from 'react';
import type { Bookmark } from '../../shared/types';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  visible: boolean;
  onBookmarkClick: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
}

export default function BookmarksBar({ bookmarks, visible, onBookmarkClick, onRemoveBookmark }: BookmarksBarProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--bookmarks-bar-height)',
        padding: '0 8px',
        gap: 2,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--text-secondary)',
      }}
    >
      {bookmarks.length === 0 && (
        <span style={{ padding: '0 8px', color: 'var(--text-muted)' }}>Bookmarks bar — click the ★ in the address bar to bookmark</span>
      )}
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '2px 4px',
            borderRadius: 'var(--radius-sm)',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <button
            onClick={() => onBookmarkClick(bm.url)}
            style={{
              padding: '2px 6px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 150,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title={bm.url}
          >
            {bm.title || bm.url}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveBookmark(bm.id); }}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'var(--text-muted)',
              opacity: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            title="Remove bookmark"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
