/**
 * Configurable Theme System
 * Colors can be overridden by Corporater settings or client configuration
 */

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // UI colors
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Overlay
  overlayBackground: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

// Default Corporater theme (can be overridden)
export const DEFAULT_THEME: Theme = {
  name: 'corporater',
  colors: {
    primary: '#0066B3',        // Corporater Blue
    primaryDark: '#004d86',
    primaryLight: '#e6f0f9',

    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',

    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0066B3',

    overlayBackground: 'rgba(0, 0, 0, 0.75)'
  }
};

// Alternative themes
export const THEMES: Record<string, Theme> = {
  corporater: DEFAULT_THEME,

  dark: {
    name: 'dark',
    colors: {
      primary: '#3b82f6',
      primaryDark: '#2563eb',
      primaryLight: '#1e3a5f',

      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',

      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',

      overlayBackground: 'rgba(0, 0, 0, 0.85)'
    }
  },

  light: {
    name: 'light',
    colors: {
      primary: '#0066B3',
      primaryDark: '#004d86',
      primaryLight: '#e6f0f9',

      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',

      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0066B3',

      overlayBackground: 'rgba(0, 0, 0, 0.75)'
    }
  }
};

/**
 * Apply theme colors as CSS variables
 */
export function applyTheme(theme: Theme | ThemeColors): void {
  const colors = 'colors' in theme ? theme.colors : theme;
  const root = document.documentElement;

  root.style.setProperty('--clickpath-primary', colors.primary);
  root.style.setProperty('--clickpath-primary-dark', colors.primaryDark);
  root.style.setProperty('--clickpath-primary-light', colors.primaryLight);
  root.style.setProperty('--clickpath-background', colors.background);
  root.style.setProperty('--clickpath-surface', colors.surface);
  root.style.setProperty('--clickpath-text', colors.text);
  root.style.setProperty('--clickpath-text-muted', colors.textMuted);
  root.style.setProperty('--clickpath-border', colors.border);
  root.style.setProperty('--clickpath-success', colors.success);
  root.style.setProperty('--clickpath-warning', colors.warning);
  root.style.setProperty('--clickpath-error', colors.error);
  root.style.setProperty('--clickpath-info', colors.info);
  root.style.setProperty('--clickpath-overlay-bg', colors.overlayBackground);
}

/**
 * Get theme from Corporater settings or storage
 */
export async function getTheme(): Promise<Theme> {
  try {
    // First check Chrome storage for cached/custom theme
    const stored = await chrome.storage.sync.get(['theme', 'customColors']);

    if (stored.customColors) {
      // Merge custom colors with default
      return {
        name: 'custom',
        colors: { ...DEFAULT_THEME.colors, ...stored.customColors }
      };
    }

    if (stored.theme && THEMES[stored.theme]) {
      return THEMES[stored.theme];
    }

    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Save custom theme colors
 */
export async function saveThemeColors(colors: Partial<ThemeColors>): Promise<void> {
  await chrome.storage.sync.set({ customColors: colors });
}
