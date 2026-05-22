import React from 'react';
import Tab from './Tab';

interface TabData {
  id: string;
  url: string;
  title: string;
  favicon: string;
  loading: boolean;
  pinned: boolean;
  active: boolean;
}

interface TabStripProps {
  tabs: TabData[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
}

export default function TabStrip({ tabs, onSelect, onClose, onNewTab }: TabStripProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--tab-height)',
        gap: 1,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          overflow: 'auto',
          paddingLeft: 4,
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            favicon={tab.favicon}
            loading={tab.loading}
            active={tab.active}
            pinned={tab.pinned}
            onSelect={onSelect}
            onClose={onClose}
          />
        ))}
      </div>
      <button
        onClick={onNewTab}
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: 'var(--text-muted)',
          transition: 'background var(--transition)',
          flexShrink: 0,
          marginRight: 4,
        }}
        title="New tab"
      >
        +
      </button>
    </div>
  );
}
