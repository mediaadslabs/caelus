import React, { useCallback } from 'react';
import { SEARCH_ENGINE } from '../../shared/constants';

interface OmniboxProps {
  url: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
}

function isUrl(text: string): boolean {
  if (text.includes(' ') || text.includes('.')) return false;
  try {
    new URL(text);
    return true;
  } catch {
    return text.startsWith('http://') || text.startsWith('https://') || text.startsWith('file://');
  }
}

function normalizeUrl(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return 'about:blank';
  if (isUrl(trimmed)) {
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('file://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
  if (trimmed.startsWith('!')) {
    return trimmed;
  }
  return SEARCH_ENGINE.replace('{searchTerms}', encodeURIComponent(trimmed));
}

export default function Omnibox({
  url,
  loading,
  canGoBack,
  canGoForward,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
}: OmniboxProps) {
  const [inputValue, setInputValue] = React.useState(url);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!focused) {
      setInputValue(url);
    }
  }, [url, focused]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const navUrl = normalizeUrl(inputValue);
        onNavigate(navUrl);
        inputRef.current?.blur();
      }
    },
    [inputValue, onNavigate],
  );

  const displayUrl = focused ? inputValue : (url || '');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--toolbar-height)',
        gap: 4,
        padding: '0 8px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button onClick={onGoBack} style={navBtnStyle} disabled={!canGoBack} title="Back">
        ◀
      </button>
      <button onClick={onGoForward} style={navBtnStyle} disabled={!canGoForward} title="Forward">
        ▶
      </button>
      {loading ? (
        <button onClick={onStop} style={navBtnStyle} title="Stop">
          ✕
        </button>
      ) : (
        <button onClick={onReload} style={navBtnStyle} title="Reload">
          ↻
        </button>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: focused ? '1px solid var(--accent)' : '1px solid var(--border)',
          padding: '0 10px',
          height: 30,
          transition: 'border var(--transition)',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: url.startsWith('https') ? 'var(--success)' : 'var(--text-muted)',
            marginRight: 6,
          }}
        >
          {url.startsWith('https') ? '🔒' : 'ℹ'}
        </span>
        <input
          ref={inputRef}
          value={displayUrl}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setInputValue(url);
            inputRef.current?.select();
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-md)',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: 'var(--text-secondary)',
  opacity: 0.7,
  transition: 'background var(--transition), opacity var(--transition)',
};
