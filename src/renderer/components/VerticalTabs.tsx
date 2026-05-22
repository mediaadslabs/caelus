import React from 'react';

interface TabData {
  id: string;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  pinned: boolean;
  active: boolean;
}

interface VerticalTabsProps {
  tabs: TabData[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function VerticalTabs({
  tabs,
  onSelect,
  onClose,
  onNewTab,
  collapsed,
  onToggleCollapse,
}: VerticalTabsProps) {
  const width = collapsed ? 38 : 200;

  return (
    <div
      style={{
        width,
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 150ms ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 0',
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            onMouseDown={(e) => { if (e.button === 1) onClose(tab.id); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: collapsed ? '0 8px' : '0 8px 0 12px',
              margin: '1px 4px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: tab.active ? 'var(--bg-hover)' : 'transparent',
              color: tab.active ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'background var(--transition)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={tab.title}
          >
            {tab.loading ? (
              <span style={{ fontSize: 10, color: 'var(--accent)', flexShrink: 0 }}>◌</span>
            ) : tab.favicon ? (
              <img src={tab.favicon} alt="" style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }} />
            ) : (
              <span style={{ fontSize: 14, flexShrink: 0 }}>{'🌐'}</span>
            )}
            {!collapsed && (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontSize: 'var(--font-size-sm)' }}>
                  {tab.title || 'New Tab'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: 'var(--text-muted)', opacity: 0, flexShrink: 0,
                    transition: 'opacity var(--transition)',
                  }}
                  className="tab-close-btn"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: '4px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onNewTab}
          style={{
            width: '100%',
            height: 32,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: 'var(--text-secondary)',
            fontSize: collapsed ? 14 : 'var(--font-size-sm)',
            transition: 'background var(--transition)',
          }}
          title="New tab"
        >
          {collapsed ? '+' : '+ New Tab'}
        </button>
      </div>
      <div style={{ padding: '4px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onToggleCollapse}
          style={{
            width: '100%',
            height: 28,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 10,
            transition: 'background var(--transition)',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀ Collapse'}
        </button>
      </div>
    </div>
  );
}
