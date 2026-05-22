import React from 'react';
import type { Bookmark } from '../../shared/types';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  visible: boolean;
  onBookmarkClick: (url: string) => void;
}

export default function BookmarksBar({ bookmarks, visible, onBookmarkClick }: BookmarksBarProps) {
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
        <span style={{ padding: '0 8px', color: 'var(--text-muted)' }}>Bookmarks bar</span>
      )}
      {bookmarks.map((bm) => (
        <button
          key={bm.id}
          onClick={() => onBookmarkClick(bm.url)}
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 150,
            transition: 'background var(--transition)',
          }}
          title={bm.url}
        >
          {bm.title || bm.url}
        </button>
      ))}
    </div>
  );
}
