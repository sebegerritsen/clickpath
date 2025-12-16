/**
 * ClickPath Configuration
 * Stores settings and API configuration
 */

export interface ClickPathConfig {
  // API settings
  corporaterApiUrl?: string;
  useExternalApi: boolean;

  // Feature flags
  enableAutoStart: boolean;
  enableHelpButton: boolean;
  enableKeyboardShortcuts: boolean;

  // Tour settings
  defaultOverlayOpacity: number;
  defaultSpotlightPadding: number;
  scrollBehavior: 'smooth' | 'auto' | 'none';

  // Storage
  syncProgressToCorporater: boolean;
  cacheToursLocally: boolean;
}

export const DEFAULT_CONFIG: ClickPathConfig = {
  useExternalApi: false,

  enableAutoStart: true,
  enableHelpButton: true,
  enableKeyboardShortcuts: true,

  defaultOverlayOpacity: 0.75,
  defaultSpotlightPadding: 8,
  scrollBehavior: 'smooth',

  syncProgressToCorporater: true,
  cacheToursLocally: true
};

/**
 * Get configuration from storage
 */
export async function getConfig(): Promise<ClickPathConfig> {
  try {
    const stored = await chrome.storage.sync.get('config');
    return { ...DEFAULT_CONFIG, ...stored.config };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to storage
 */
export async function saveConfig(config: Partial<ClickPathConfig>): Promise<void> {
  const current = await getConfig();
  await chrome.storage.sync.set({ config: { ...current, ...config } });
}

/**
 * Get the extension ID for detection scripts
 */
export function getExtensionId(): string {
  return chrome.runtime.id;
}
