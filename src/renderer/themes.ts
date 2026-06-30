export interface ThemeColors {
  'bg-primary': string;
  'bg-secondary': string;
  'bg-tertiary': string;
  'bg-surface': string;
  'bg-hover': string;
  'bg-active': string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
  'accent': string;
  'accent-hover': string;
  'border': string;
  'danger': string;
  'success': string;
  'warning': string;
}

export interface Theme {
  id: string;
  name: string;
  premium?: boolean;
  colors: ThemeColors;
}

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'dark-default',
    name: 'Caelus Dark',
    colors: {
      'bg-primary': '#1a1a2e',
      'bg-secondary': '#16213e',
      'bg-tertiary': '#0f3460',
      'bg-surface': '#1e1e36',
      'bg-hover': '#2a2a4a',
      'bg-active': '#3a3a5e',
      'text-primary': '#e8e8f0',
      'text-secondary': '#a0a0b8',
      'text-muted': '#6a6a80',
      'accent': '#6c63ff',
      'accent-hover': '#7b73ff',
      'border': '#2a2a44',
      'danger': '#ff4757',
      'success': '#2ed573',
      'warning': '#ffa502',
    },
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      'bg-primary': '#ffffff',
      'bg-secondary': '#f5f5f7',
      'bg-tertiary': '#e8e8ed',
      'bg-surface': '#f0f0f5',
      'bg-hover': '#e5e5ea',
      'bg-active': '#d1d1d6',
      'text-primary': '#1d1d1f',
      'text-secondary': '#6e6e73',
      'text-muted': '#aeaeb2',
      'accent': '#6c63ff',
      'accent-hover': '#5a52e0',
      'border': '#d1d1d6',
      'danger': '#ff3b30',
      'success': '#34c759',
      'warning': '#ff9500',
    },
  },
  {
    id: 'dark-amoled',
    name: 'AMOLED Dark',
    colors: {
      'bg-primary': '#000000',
      'bg-secondary': '#0a0a0a',
      'bg-tertiary': '#121212',
      'bg-surface': '#0d0d0d',
      'bg-hover': '#1a1a1a',
      'bg-active': '#262626',
      'text-primary': '#e0e0e0',
      'text-secondary': '#888888',
      'text-muted': '#555555',
      'accent': '#6c63ff',
      'accent-hover': '#7b73ff',
      'border': '#1a1a1a',
      'danger': '#ff4757',
      'success': '#2ed573',
      'warning': '#ffa502',
    },
  },
  {
    id: 'premium-ocean',
    name: 'Premium: Ocean Depths',
    premium: true,
    colors: {
      'bg-primary': '#0a1628',
      'bg-secondary': '#0f1f3d',
      'bg-tertiary': '#152d5e',
      'bg-surface': '#0d1f3a',
      'bg-hover': '#1a3055',
      'bg-active': '#224478',
      'text-primary': '#e0f0ff',
      'text-secondary': '#80b0e0',
      'text-muted': '#4a7a9a',
      'accent': '#00bcd4',
      'accent-hover': '#26c6da',
      'border': '#1a3050',
      'danger': '#ff5252',
      'success': '#4caf50',
      'warning': '#ffab40',
    },
  },
  {
    id: 'premium-matrix',
    name: 'Premium: Matrix',
    premium: true,
    colors: {
      'bg-primary': '#0a0a0a',
      'bg-secondary': '#0d1a0d',
      'bg-tertiary': '#0f2a0f',
      'bg-surface': '#0a120a',
      'bg-hover': '#1a2a1a',
      'bg-active': '#2a3a2a',
      'text-primary': '#00ff41',
      'text-secondary': '#00cc33',
      'text-muted': '#008800',
      'accent': '#00ff41',
      'accent-hover': '#33ff66',
      'border': '#1a3a1a',
      'danger': '#ff0033',
      'success': '#00ff41',
      'warning': '#ffff00',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: {
      'bg-primary': '#fbf0d9',
      'bg-secondary': '#f5e6c8',
      'bg-tertiary': '#e8d5a8',
      'bg-surface': '#f2e2c0',
      'bg-hover': '#ebd9b0',
      'bg-active': '#dcc89c',
      'text-primary': '#3b2f1e',
      'text-secondary': '#6b5a3e',
      'text-muted': '#9c8a6a',
      'accent': '#8b6f47',
      'accent-hover': '#7a5f3c',
      'border': '#d4bf98',
      'danger': '#c0392b',
      'success': '#27ae60',
      'warning': '#e67e22',
    },
  },
];

export function getThemeById(id: string): Theme | undefined {
  return BUILT_IN_THEMES.find((t) => t.id === id);
}

export function applyTheme(themeId: string): void {
  const theme = getThemeById(themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export function resetTheme(): void {
  const root = document.documentElement;
  const defaultTheme = getThemeById('dark-default');
  if (!defaultTheme) return;
  for (const key of Object.keys(defaultTheme.colors)) {
    root.style.removeProperty(`--${key}`);
  }
}
