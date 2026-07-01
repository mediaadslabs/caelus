import React, { useCallback, useEffect, useState } from 'react';
import { keysToString, eventKeysToString } from '../hooks/useShortcutManager';
import { BUILT_IN_THEMES, applyTheme } from '../themes';
import { APP_NAME, APP_VERSION, AUTHOR_NAME, COPYRIGHT_YEARS, GITHUB_RELEASES_PAGE } from '../../shared/constants';

interface SettingsProps {
  onClose: () => void;
  db: Database;
  onSave: (db: Database) => void;
  onPwaLaunch?: (app: PwaApp) => void;
  onPwaUninstall?: (appId: string) => void;
}

export default function Settings({ onClose, db, onSave, onPwaLaunch, onPwaUninstall }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({ ...db.settings });
  const [agents, setAgents] = useState<Agent[]>(db.agents || []);
  const [extensions, setExtensions] = useState<ExtensionEntry[]>(db.extensions || []);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [fetching, setFetching] = useState(false);
  const [modelError, setModelError] = useState('');
  const [extPath, setExtPath] = useState('');
  const [extMsg, setExtMsg] = useState('');
  const [loadedExts, setLoadedExts] = useState<{ id: string; name: string; path: string }[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>(db.shortcuts || []);
  const [themeError, setThemeError] = useState('');
  const [capturingId, setCapturingId] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string[] | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showAgentEditor, setShowAgentEditor] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncError, setSyncError] = useState('');
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateChecked, setUpdateChecked] = useState(false);

  useEffect(() => {
    window.electronAPI?.extensionList().then(setLoadedExts).catch(() => {});
  }, []);

  const handleSyncPush = useCallback(async () => {
    setSyncStatus('');
    setSyncError('');
    const data = JSON.stringify({
      settings: { ...settings, sync: { ...settings.sync, encryptionPassword: '', apiKey: '' } },
      agents,
      shortcuts,
      bookmarks: db.bookmarks || [],
    });
    const result = await window.electronAPI?.syncPush({
      data,
      serverUrl: settings.sync.serverUrl,
      password: settings.sync.encryptionPassword,
      apiKey: settings.sync.apiKey,
    });
    if (result?.success) {
      setSyncStatus('Sync pushed successfully');
      const now = new Date().toISOString();
      updateSetting('sync', { ...settings.sync, lastSyncedAt: now });
    } else {
      setSyncError(result?.error || 'Sync push failed');
    }
  }, [settings, agents, shortcuts, db.bookmarks]);

  const handleSyncPull = useCallback(async () => {
    setSyncStatus('');
    setSyncError('');
    const result = await window.electronAPI?.syncPull({
      serverUrl: settings.sync.serverUrl,
      password: settings.sync.encryptionPassword,
      apiKey: settings.sync.apiKey,
    });
    if (result?.success && result.data) {
      try {
        const remote = JSON.parse(result.data);
        if (remote.settings) {
          setSettings((prev) => ({
            ...prev,
            ...remote.settings,
            sync: { ...prev.sync, lastSyncedAt: new Date().toISOString() },
          }));
        }
        if (remote.agents) setAgents(remote.agents);
        if (remote.shortcuts) setShortcuts(remote.shortcuts);
        setSyncStatus('Sync pulled successfully');
      } catch {
        setSyncError('Failed to parse synced data');
      }
    } else {
      setSyncError(result?.error || 'Sync pull failed');
    }
  }, [settings.sync]);

  const handleSyncTest = useCallback(async () => {
    setSyncStatus('');
    setSyncError('');
    const result = await window.electronAPI?.syncTest({
      serverUrl: settings.sync.serverUrl,
      apiKey: settings.sync.apiKey,
    });
    if (result?.success) {
      setSyncStatus('Connection successful');
    } else {
      setSyncError(result?.error || 'Connection failed');
    }
  }, [settings.sync.serverUrl, settings.sync.apiKey]);

  const handleCheckUpdates = useCallback(async () => {
    setCheckingUpdates(true);
    setUpdateError('');
    setUpdateChecked(false);
    setUpdateAvailable(false);
    const result = await window.electronAPI?.checkForUpdates();
    if (result?.success && result.latestVersion) {
      setUpdateChecked(true);
      const current = APP_VERSION.split('.').map(Number);
      const latest = result.latestVersion.split('.').map(Number);
      const isNewer = latest.length === 3 && current.length === 3 &&
        (latest[0] > current[0] || (latest[0] === current[0] && latest[1] > current[1]) || (latest[0] === current[0] && latest[1] === current[1] && latest[2] > current[2]));
      if (isNewer) {
        setUpdateAvailable(true);
        setUpdateVersion(result.latestVersion);
      }
    } else {
      setUpdateError(result?.error || 'Failed to check for updates');
    }
    setCheckingUpdates(false);
  }, []);

  const handleDownloadUpdate = useCallback(() => {
    window.open(GITHUB_RELEASES_PAGE, '_blank');
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const [premiumKey, setPremiumKey] = useState('');
  const [premiumError, setPremiumError] = useState('');
  const [premiumActivated, setPremiumActivated] = useState(false);

  const handleActivatePremium = useCallback(async () => {
    setPremiumError('');
    setPremiumActivated(false);
    const key = premiumKey.trim();
    if (!key) {
      setPremiumError('Please enter a license key.');
      return;
    }
    try {
      const api = window.electronAPI;
      if (!api) {
        setPremiumError('License verification unavailable.');
        return;
      }
      const result = await api.verifyLicense(key);
      if (!result.valid) {
        setPremiumError(result.error || 'Invalid license key.');
        return;
      }
      updateSetting('premium', {
        enabled: true,
        licenseKey: key,
        activatedAt: new Date().toISOString(),
      });
      setPremiumActivated(true);
      setPremiumKey('');
    } catch (e) {
      setPremiumError('Verification failed. Please try again.');
    }
  }, [premiumKey, updateSetting]);

  const handleDeactivatePremium = useCallback(() => {
    updateSetting('premium', {
      enabled: false,
      licenseKey: '',
      activatedAt: null,
    });
  }, [updateSetting]);

  const handleSave = () => {
    onSave({ settings, agents, extensions, session: db.session, conversations: db.conversations || [], tasks: db.tasks || [], shortcuts, bookmarks: db.bookmarks || [], installedApps: db.installedApps || [] });
    onClose();
  };

  const handleFetchModels = async () => {
    setFetching(true);
    setModelError('');
    const result = await window.electronAPI?.ollamaFetchModels(settings.ollamaEndpoint, settings.ollamaApiKey);
    if (result?.success && result.models) {
      setModels(result.models);
      if (result.models.length > 0 && !settings.selectedModel) {
        updateSetting('selectedModel', result.models[0].name);
      }
    } else {
      setModelError(result?.error || 'Failed to fetch models');
    }
    setFetching(false);
  };

  const handleLoadExtension = async () => {
    if (!extPath) return;
    setExtMsg('');
    const result = await window.electronAPI?.extensionLoad(extPath);
    if (result?.success) {
      setExtMsg(`Loaded: ${result.name}`);
      setExtensions((prev) => {
        if (prev.find((e) => e.path === extPath)) return prev;
        return [...prev, { path: extPath, name: result.name || 'Unknown', enabled: true }];
      });
      setExtPath('');
      const exts = await window.electronAPI?.extensionList();
      if (exts) setLoadedExts(exts);
    } else {
      setExtMsg(`Error: ${result?.error}`);
    }
  };

  const handleRemoveExtension = async (extId: string) => {
    await window.electronAPI?.extensionRemove(extId);
    const exts = await window.electronAPI?.extensionList();
    if (exts) setLoadedExts(exts);
  };

  const addAgent = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: '',
      systemPrompt: 'You are a helpful AI assistant.',
      model: settings.selectedModel || '',
      temperature: 0.7,
      enabled: true,
      enableTools: false,
    };
    setEditingAgent(newAgent);
    setShowAgentEditor(true);
  };

  const editAgent = (agent: Agent) => {
    setEditingAgent({ ...agent });
    setShowAgentEditor(true);
  };

  const saveAgent = () => {
    if (!editingAgent) return;
    setAgents((prev) => {
      const idx = prev.findIndex((a) => a.id === editingAgent.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = editingAgent;
        return next;
      }
      return [...prev, editingAgent];
    });
    setShowAgentEditor(false);
    setEditingAgent(null);
  };

  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const startCapture = useCallback((shortcutId: string) => {
    setCapturingId(shortcutId);
    setCapturedKeys(null);
  }, []);

  const saveCapture = useCallback(() => {
    if (!capturingId || !capturedKeys) return;
    setShortcuts((prev) =>
      prev.map((s) =>
        s.id === capturingId ? { ...s, keys: capturedKeys } : s,
      ),
    );
    setCapturingId(null);
    setCapturedKeys(null);
  }, [capturingId, capturedKeys]);

  const cancelCapture = useCallback(() => {
    setCapturingId(null);
    setCapturedKeys(null);
  }, []);

  const toggleShortcut = useCallback((shortcutId: string) => {
    setShortcuts((prev) =>
      prev.map((s) =>
        s.id === shortcutId ? { ...s, enabled: !s.enabled } : s,
      ),
    );
  }, []);

  const resetShortcuts = useCallback(() => {
    const defaultShortcuts: ShortcutEntry[] = [
      { id: 'new-tab', label: 'New Tab', keys: ['Ctrl', 'T'], action: 'new-tab', enabled: true },
      { id: 'close-tab', label: 'Close Tab', keys: ['Ctrl', 'W'], action: 'close-tab', enabled: true },
      { id: 'toggle-split', label: 'Toggle Split View', keys: ['Ctrl', 'Shift', 'S'], action: 'toggle-split', enabled: true },
      { id: 'copy-url', label: 'Copy Current URL', keys: ['Ctrl', 'Shift', 'C'], action: 'copy-url', enabled: true },
      { id: 'focus-omnibox', label: 'Focus Address Bar', keys: ['Ctrl', 'L'], action: 'focus-omnibox', enabled: true },
    ];
    setShortcuts(defaultShortcuts);
  }, []);

  useEffect(() => {
    if (!capturingId) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const keys = eventKeysToString(e);
      setCapturedKeys(keys);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [capturingId]);

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', height: 46 }}>
        <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Settings</span>
        <button onClick={handleSave} style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 600 }}>
        <Section title="AI & Agents">
          <SettingRow label="Ollama Endpoint" description="URL of your Ollama API server">
            <input type="text" value={settings.ollamaEndpoint} onChange={(e) => updateSetting('ollamaEndpoint', e.target.value)}
              style={inputStyle} placeholder="http://localhost:11434" />
          </SettingRow>
          <SettingRow label="API Key" description="API key for Ollama Cloud (leave empty for local Ollama)">
            <input type="password" value={settings.ollamaApiKey} onChange={(e) => updateSetting('ollamaApiKey', e.target.value)}
              style={inputStyle} placeholder="sk-..." />
          </SettingRow>
          <SettingRow label="Available Models" description="Fetch models from Ollama">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleFetchModels} disabled={fetching} style={btnStyle}>
                {fetching ? 'Fetching...' : 'Fetch Models'}
              </button>
              {models.length > 0 && (
                <span style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)' }}>{models.length} models</span>
              )}
            </div>
          </SettingRow>
          {modelError && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>{modelError}</div>}
          <SettingRow label="Select Model" description="Default model for agents">
            <select value={settings.selectedModel} onChange={(e) => updateSetting('selectedModel', e.target.value)} style={selectStyle}>
              <option value="">-- Select --</option>
              {settings.selectedModel && !models.find((m) => m.name === settings.selectedModel) && (
                <option value={settings.selectedModel}>{settings.selectedModel}</option>
              )}
              {models.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </SettingRow>

          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>Agents</span>
              <button onClick={addAgent} style={btnStyle}>+ Add Agent</button>
            </div>
            {agents.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 8 }}>No agents configured yet.</div>
            )}
            {agents.map((agent) => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>{agent.name || 'Unnamed Agent'}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Model: {agent.model || 'Not set'}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => editAgent(agent)} style={smallBtn}>Edit</button>
                  <button onClick={() => deleteAgent(agent.id)} style={{ ...smallBtn, color: 'var(--error)' }}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {showAgentEditor && editingAgent && (
          <Section title={agents.find((a) => a.id === editingAgent.id) ? 'Edit Agent' : 'New Agent'}>
            <SettingRow label="Name" description="Agent display name">
              <input type="text" value={editingAgent.name} onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Model" description="Ollama model for this agent">
              <select value={editingAgent.model} onChange={(e) => setEditingAgent({ ...editingAgent, model: e.target.value })} style={selectStyle}>
                <option value="">-- Select --</option>
                {editingAgent.model && !models.find((m) => m.name === editingAgent.model) && (
                  <option value={editingAgent.model}>{editingAgent.model}</option>
                )}
                {models.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </SettingRow>
            <SettingRow label="Temperature" description="Response randomness (0-2)">
              <input type="number" min="0" max="2" step="0.1" value={editingAgent.temperature}
                onChange={(e) => setEditingAgent({ ...editingAgent, temperature: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </SettingRow>
            <SettingRow label="Enable tools" description="Let the agent search the web, open tabs, bookmark pages, and take notes">
              <input type="checkbox" checked={editingAgent.enableTools}
                onChange={(e) => setEditingAgent({ ...editingAgent, enableTools: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
            </SettingRow>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)', marginBottom: 4 }}>System Prompt</div>
              <textarea value={editingAgent.systemPrompt} onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                style={{ ...inputStyle, width: '100%', minHeight: 80, resize: 'vertical', fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveAgent} style={btnStyle}>Save Agent</button>
              <button onClick={() => setShowAgentEditor(false)} style={{ ...btnStyle, background: 'var(--bg-surface)' }}>Cancel</button>
            </div>
          </Section>
        )}

        <Section title="Extensions">
          <SettingRow label="Load Extension" description="Path to Chrome extension folder">
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={extPath} onChange={(e) => setExtPath(e.target.value)} style={inputStyle} placeholder="/path/to/extension" />
              <button onClick={handleLoadExtension} style={btnStyle}>Load</button>
            </div>
          </SettingRow>
          {extMsg && <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: 8, color: extMsg.startsWith('Error') ? 'var(--error)' : 'var(--success)' }}>{extMsg}</div>}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 8 }}>Loaded Extensions</div>
            {loadedExts.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 8 }}>No extensions loaded.</div>
            )}
            {loadedExts.map((ext) => (
              <div key={ext.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 4 }}>
                <span style={{ fontSize: 'var(--font-size-md)' }}>{ext.name}</span>
                <button onClick={() => handleRemoveExtension(ext.id)} style={{ ...smallBtn, color: 'var(--error)' }}>Remove</button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Appearance">
          <SettingRow label="Layout mode" description="Classic, Compact, or Vertical tabs">
            <select value={settings.layout} onChange={(e) => updateSetting('layout', e.target.value)} style={selectStyle}>
              <option value="classic">Classic</option>
              <option value="compact">Compact</option>
              <option value="vertical">Vertical</option>
            </select>
          </SettingRow>
          <SettingRow label="Theme" description="Color scheme for the browser">
            <select value={settings.theme} onChange={(e) => {
              const theme = BUILT_IN_THEMES.find(t => t.id === e.target.value);
              if (theme?.premium && !settings.premium?.enabled) {
                setThemeError('Premium theme — upgrade to Caelus Premium to unlock');
                return;
              }
              setThemeError('');
              updateSetting('theme', e.target.value);
              applyTheme(e.target.value);
            }} style={selectStyle}>
              {BUILT_IN_THEMES.map((t) => (
                <option key={t.id} value={t.id} disabled={t.premium && !settings.premium?.enabled}>
                  {t.premium && !settings.premium?.enabled ? `🔒 ${t.name}` : t.name}
                </option>
              ))}
            </select>
          </SettingRow>
          {themeError && <div style={{ color: 'var(--warning)', fontSize: 'var(--font-size-xs)', marginTop: -8, marginBottom: 8 }}>{themeError}</div>}
          <SettingRow label="Show bookmarks bar" description="Display bookmark bar below toolbar">
            <input type="checkbox" checked={settings.showBookmarksBar} onChange={(e) => updateSetting('showBookmarksBar', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="Privacy & Security">
          <SettingRow label="Ad blocking" description="Block ads and trackers using pattern matching">
            <input type="checkbox" checked={settings.adBlocking} onChange={(e) => updateSetting('adBlocking', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
          <SettingRow label="Block third-party cookies" description="Prevent cross-site tracking">
            <input type="checkbox" checked={settings.blockThirdPartyCookies} onChange={(e) => updateSetting('blockThirdPartyCookies', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
          <SettingRow label="HTTPS enforcement" description="Upgrade all connections to HTTPS">
            <input type="checkbox" checked={settings.httpsEnforcement} onChange={(e) => updateSetting('httpsEnforcement', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="Search">
          <SettingRow label="Default search engine" description="Used in address bar and new tab page">
            <select value={settings.defaultSearchEngine} onChange={(e) => updateSetting('defaultSearchEngine', e.target.value)} style={selectStyle}>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="brave">Brave Search</option>
            </select>
          </SettingRow>
        </Section>

        <Section title="Bangs">
          <SettingRow label="Enable !bangs" description="Quick search shortcuts (!gh, !w, etc.)">
            <input type="checkbox" checked={settings.enableBangs} onChange={(e) => updateSetting('enableBangs', e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
        </Section>

        <Section title="Sync">
          <SettingRow label="Enable sync" description="Sync settings, bookmarks, agents, and shortcuts">
            <input type="checkbox" checked={settings.sync.enabled} onChange={(e) => updateSetting('sync', { ...settings.sync, enabled: e.target.checked })}
              style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          </SettingRow>
          {settings.sync.enabled && (
            <>
              <SettingRow label="Server URL" description="Sync server endpoint (e.g. https://sync.example.com)">
                <input type="text" value={settings.sync.serverUrl} onChange={(e) => updateSetting('sync', { ...settings.sync, serverUrl: e.target.value })}
                  style={inputStyle} placeholder="https://sync.example.com" />
              </SettingRow>
              <SettingRow label="API Key" description="Authentication key for sync server">
                <input type="password" value={settings.sync.apiKey} onChange={(e) => updateSetting('sync', { ...settings.sync, apiKey: e.target.value })}
                  style={inputStyle} placeholder="sk-..." />
              </SettingRow>
              <SettingRow label="Encryption password" description="Password used to encrypt data before upload (must match on all devices)">
                <input type="password" value={settings.sync.encryptionPassword} onChange={(e) => updateSetting('sync', { ...settings.sync, encryptionPassword: e.target.value })}
                  style={inputStyle} placeholder="Sync encryption password" />
              </SettingRow>
              <SettingRow label="Last synced" description={settings.sync.lastSyncedAt ? new Date(settings.sync.lastSyncedAt).toLocaleString() : 'Never'}>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  {settings.sync.lastSyncedAt ? new Date(settings.sync.lastSyncedAt).toLocaleString() : 'Never'}
                </span>
              </SettingRow>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={handleSyncTest} style={btnStyle}>Test Connection</button>
                <button onClick={handleSyncPull} style={btnStyle}>Pull from Server</button>
                <button onClick={handleSyncPush} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}>Push to Server</button>
              </div>
              {syncStatus && <div style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>{syncStatus}</div>}
              {syncError && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>{syncError}</div>}
            </>
          )}
        </Section>

        <Section title="Caelus Premium">
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: settings.premium?.enabled ? 'linear-gradient(135deg, #6c63ff20, #ffa50220)' : 'var(--bg-surface)',
            border: settings.premium?.enabled ? '1px solid #6c63ff40' : '1px solid var(--border)',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{settings.premium?.enabled ? '👑' : '☆'}</span>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)' }}>
                {settings.premium?.enabled ? 'Premium Active' : 'Unlock Premium'}
              </span>
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
              {settings.premium?.enabled ? (
                <>All premium features are unlocked. Thank you for supporting {APP_NAME}!</>
              ) : (
                <>Upgrade to Premium and get exclusive features:
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>🔒 Advanced ad blocking lists</li>
                    <li>🎨 Premium themes & gradients</li>
                    <li>🤖 Unlimited AI agent messages</li>
                    <li>☁️ Priority sync & backup</li>
                    <li>⭐ Priority support & early access</li>
                    <li>🚫 No branding (remove "Powered by Caelus")</li>
                  </ul>
                </>
              )}
            </div>
            {!settings.premium?.enabled ? (
              <>
                <SettingRow label="License Key" description="Enter your premium license key">
                  <input type="text" value={premiumKey} onChange={(e) => setPremiumKey(e.target.value)}
                    style={inputStyle} placeholder="XXXX-XXXX-XXXX-XXXX" />
                </SettingRow>
                {premiumError && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>{premiumError}</div>}
                {premiumActivated && <div style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>Premium activated successfully!</div>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={handleActivatePremium} disabled={!premiumKey.trim()} style={{ ...btnStyle, background: 'linear-gradient(135deg, #6c63ff, #ffa502)', color: '#fff', border: 'none' }}>
                    Activate Premium
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={handleDeactivatePremium} style={{ ...btnStyle, color: 'var(--error)' }}>
                  Deactivate Premium
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section title="Keyboard Shortcuts">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={resetShortcuts} style={{ ...smallBtn, fontSize: 'var(--font-size-xs)' }}>Reset to defaults</button>
          </div>
          {shortcuts.map((sc) => (
            <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 4, minHeight: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={sc.enabled} onChange={() => toggleShortcut(sc.id)}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{sc.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {capturingId === sc.id ? (
                  <>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: capturedKeys ? 'var(--accent)' : 'var(--warning)', minWidth: 100, textAlign: 'right' }}>
                      {capturedKeys ? keysToString(capturedKeys) : 'Press shortcut...'}
                    </span>
                    <button onClick={saveCapture} disabled={!capturedKeys} style={{ ...smallBtn, color: 'var(--success)' }}>Save</button>
                    <button onClick={cancelCapture} style={{ ...smallBtn, color: 'var(--text-muted)' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', minWidth: 100, textAlign: 'right', fontFamily: 'monospace' }}>
                      {keysToString(sc.keys)}
                    </span>
                    <button onClick={() => startCapture(sc.id)} style={smallBtn}>Edit</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {shortcuts.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 8 }}>No shortcuts configured.</div>
          )}
        </Section>

        <Section title="Apps">
          {(db.installedApps || []).length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 8 }}>No apps installed.</div>
          )}
          {(db.installedApps || []).map((app) => (
            <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {app.icon && <img src={app.icon} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
                <div>
                  <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>{app.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{app.startUrl}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => onPwaLaunch?.(app)} style={{ ...smallBtn, color: 'var(--accent)' }}>Launch</button>
                <button onClick={() => onPwaUninstall?.(app.id)} style={{ ...smallBtn, color: 'var(--error)' }}>Uninstall</button>
              </div>
            </div>
          ))}
        </Section>

        <Section title="About">
          <SettingRow label="Application" description={APP_NAME}>
            <span style={{ color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{APP_NAME}</span>
          </SettingRow>
          <SettingRow label="Version" description={`${APP_NAME} v${APP_VERSION}`}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{APP_VERSION}</span>
          </SettingRow>
          <SettingRow label="Author" description={`${AUTHOR_NAME} ${COPYRIGHT_YEARS}`}>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{AUTHOR_NAME} © {COPYRIGHT_YEARS}</span>
          </SettingRow>
          <SettingRow label="Privacy" description="No telemetry, no analytics, no background requests">
            <span style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)' }}>No data collected</span>
          </SettingRow>
          <SettingRow label="Updates" description="Check for new versions on GitHub">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleCheckUpdates} disabled={checkingUpdates} style={btnStyle}>
                {checkingUpdates ? 'Checking...' : updateAvailable ? `Update to ${updateVersion} available!` : 'Check for Updates'}
              </button>
              {updateAvailable && (
                <button onClick={handleDownloadUpdate} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}>
                  Download Update
                </button>
              )}
            </div>
          </SettingRow>
          {updateError && <div style={{ color: 'var(--error)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>{updateError}</div>}
          {updateChecked && !updateAvailable && !updateError && (
            <div style={{ color: 'var(--success)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>{APP_NAME} v{APP_VERSION} is the latest version.</div>
          )}
          <SettingRow label="Source" description="View source code on GitHub">
            <button onClick={() => window.open(GITHUB_RELEASES_PAGE, '_blank')} style={{ ...btnStyle, color: 'var(--accent)' }}>
              GitHub ↗
            </button>
          </SettingRow>
        </Section>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'var(--bg-surface)' }}>Cancel</button>
          <button onClick={handleSave} style={{ ...btnStyle, background: 'var(--accent)', color: '#fff' }}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--accent)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', minHeight: 44 }}>
      <div>
        <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  fontSize: 'var(--font-size-sm)',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const smallBtn: React.CSSProperties = {
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '2px 8px',
  fontSize: 'var(--font-size-xs)',
  cursor: 'pointer',
};
