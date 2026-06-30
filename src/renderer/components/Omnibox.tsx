import React, { useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { SEARCH_ENGINE } from '../../shared/constants';
import { useLayout } from '../context/LayoutContext';

export interface OmniboxHandle {
  focus: () => void;
}

interface OmniboxProps {
  url: string;
  loading: boolean;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onSplitToggle?: () => void;
  isSplit?: boolean;
  onSettingsToggle?: () => void;
  onAgentToggle?: () => void;
  isAgentOpen?: boolean;
  onReaderToggle?: () => void;
  isReaderActive?: boolean;
  pwaApp?: { name: string; icon?: string } | null;
  onPwaInstall?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

function looksLikeUrl(text: string): boolean {
  return /^[a-zA-Z0-9-]+(\.[a-zA-Z]{2,}|:\d+)/.test(text) && !text.includes(' ');
}

function isUrl(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return looksLikeUrl(text);
  }
}

function normalizeUrl(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') return 'about:blank';
  if (isUrl(trimmed)) return trimmed;
  if (looksLikeUrl(trimmed) && !trimmed.startsWith('http')) {
    return `https://${trimmed}`;
  }
  return SEARCH_ENGINE.replace('{searchTerms}', encodeURIComponent(trimmed));
}

const Omnibox = forwardRef<OmniboxHandle, OmniboxProps>(function Omnibox({
  url,
  loading,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onStop,
  onSplitToggle,
  isSplit,
  onSettingsToggle,
  onAgentToggle,
  isAgentOpen,
  onReaderToggle,
  isReaderActive,
  pwaApp,
  onPwaInstall,
  isBookmarked,
  onToggleBookmark,
}, ref) {
  const [inputValue, setInputValue] = React.useState(url);
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
  }));
  const { cycleMode, mode } = useLayout();

  React.useEffect(() => {
    if (!focused) {
      setInputValue(url);
    }
  }, [url, focused]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const raw = inputValue.trim();
        const hasBang = raw.startsWith('!') || raw.match(/\s+!/);

        if (hasBang && window.electronAPI?.bangResolve) {
          const bangUrl = await window.electronAPI.bangResolve(raw);
          if (bangUrl) {
            onNavigate(bangUrl);
            inputRef.current?.blur();
            return;
          }
        }

        const navUrl = normalizeUrl(raw);
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
      <button onClick={onGoBack} style={navBtnStyle} title="Back">
        ◀
      </button>
      <button onClick={onGoForward} style={navBtnStyle} title="Forward">
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
      {onToggleBookmark && url && url !== 'about:blank' && (
        <button
          onClick={onToggleBookmark}
          style={{
            ...navBtnStyle,
            color: isBookmarked ? '#ffa502' : 'var(--text-secondary)',
            opacity: isBookmarked ? 1 : 0.5,
            fontSize: 16,
          }}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      )}
      {onSplitToggle && (
        <button
          onClick={onSplitToggle}
          style={{
            ...navBtnStyle,
            color: isSplit ? 'var(--accent)' : undefined,
          }}
          title={isSplit ? 'Close split view' : 'Split view (Ctrl+Shift+S)'}
        >
          ⊞
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
      <button
        onClick={cycleMode}
        style={{
          ...navBtnStyle,
          opacity: 0.5,
          fontSize: 10,
        }}
        title={`Layout: ${mode}`}
      >
        {mode === 'classic' ? '⊞' : mode === 'compact' ? '⊟' : '⊡'}
      </button>
      {onAgentToggle && (
        <button
          onClick={onAgentToggle}
          style={{
            ...navBtnStyle,
            opacity: 0.5,
            fontSize: 12,
            color: isAgentOpen ? 'var(--accent)' : undefined,
          }}
          title={isAgentOpen ? 'Close agents' : 'AI Agents'}
        >
          ◆
        </button>
      )}
      {onReaderToggle && (
        <button
          onClick={onReaderToggle}
          style={{
            ...navBtnStyle,
            opacity: 0.5,
            fontSize: 14,
            color: isReaderActive ? 'var(--accent)' : undefined,
          }}
          title={isReaderActive ? 'Close reader view' : 'Reader view'}
        >
          📖
        </button>
      )}
      {pwaApp && onPwaInstall && (
        <button
          onClick={onPwaInstall}
          style={{
            ...navBtnStyle,
            opacity: 0.5,
            fontSize: 14,
            color: 'var(--success)',
          }}
          title={`Install ${pwaApp.name}`}
        >
          +
        </button>
      )}
      {onSettingsToggle && (
        <button
          onClick={onSettingsToggle}
          style={{ ...navBtnStyle, opacity: 0.5, fontSize: 14 }}
          title="Settings"
        >
          ⚙
        </button>
      )}
    </div>
  );
});

export default Omnibox;

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
