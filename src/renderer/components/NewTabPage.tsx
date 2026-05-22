import React, { useState } from 'react';

interface Shortcut {
  title: string;
  url: string;
  icon: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { title: 'GitHub', url: 'https://github.com', icon: '⌂' },
  { title: 'Reddit', url: 'https://reddit.com', icon: '⌂' },
  { title: 'Wikipedia', url: 'https://wikipedia.org', icon: '⌂' },
  { title: 'YouTube', url: 'https://youtube.com', icon: '⌂' },
  { title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '⌂' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⌂' },
];

const SEARCH_ENGINES = [
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={searchTerms}' },
  { name: 'Google', url: 'https://www.google.com/search?q={searchTerms}' },
  { name: 'Bing', url: 'https://www.bing.com/search?q={searchTerms}' },
  { name: 'Brave', url: 'https://search.brave.com/search?q={searchTerms}' },
];

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

export default function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const searchUrl = SEARCH_ENGINES[0].url.replace('{searchTerms}', encodeURIComponent(query.trim()));
    onNavigate(searchUrl);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: 32,
        padding: 40,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 300,
            color: 'var(--text-muted)',
            letterSpacing: 4,
            marginBottom: 8,
          }}
        >
          ⊞
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Helium Clone
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search with DuckDuckGo or type a URL..."
          autoFocus
          style={{
            width: '100%',
            height: 46,
            padding: '0 16px',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-lg)',
            outline: 'none',
            transition: 'border var(--transition)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </form>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          maxWidth: 520,
        }}
      >
        {DEFAULT_SHORTCUTS.map((sc) => (
          <button
            key={sc.url}
            onClick={() => onNavigate(sc.url)}
            style={{
              width: 80,
              height: 90,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              transition: 'background var(--transition), transform var(--transition)',
            }}
            title={sc.url}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {sc.icon}
            </div>
            <span style={{ fontSize: 'var(--font-size-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 72 }}>
              {sc.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
