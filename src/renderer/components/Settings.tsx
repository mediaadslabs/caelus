import React from 'react';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          height: 46,
        }}
      >
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Settings</span>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
          maxWidth: 600,
        }}
      >
        <Section title="Appearance">
          <SettingRow label="Layout mode" description="Classic, Compact, or Vertical tabs">
            <select
              style={selectStyle}
              defaultValue="classic"
            >
              <option value="classic">Classic</option>
              <option value="compact">Compact</option>
              <option value="vertical">Vertical</option>
            </select>
          </SettingRow>
          <SettingRow label="Show bookmarks bar" description="Display bookmark bar below toolbar">
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="Privacy & Security">
          <SettingRow label="Ad blocking" description="Block ads and trackers using Ghostery lists">
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
          <SettingRow label="Block third-party cookies" description="Prevent cross-site tracking">
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
          <SettingRow label="HTTPS enforcement" description="Upgrade all connections to HTTPS">
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="Search">
          <SettingRow label="Default search engine" description="Used in address bar and new tab page">
            <select
              style={selectStyle}
              defaultValue="duckduckgo"
            >
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="brave">Brave Search</option>
            </select>
          </SettingRow>
        </Section>

        <Section title="Bangs">
          <SettingRow label="Enable !bangs" description="Quick search shortcuts (!gh, !w, etc.)">
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="About">
          <SettingRow label="Version" description="Helium Clone v0.1.0">
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>0.1.0</span>
          </SettingRow>
          <SettingRow label="Privacy" description="No telemetry, no analytics, no background requests">
            <span style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)' }}>No data collected</span>
          </SettingRow>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3
        style={{
          fontSize: 'var(--font-size-md)',
          fontWeight: 600,
          color: 'var(--accent)',
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface)',
        minHeight: 44,
      }}
    >
      <div>
        <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
          {description}
        </div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  fontSize: 'var(--font-size-sm)',
  outline: 'none',
  cursor: 'pointer',
};
