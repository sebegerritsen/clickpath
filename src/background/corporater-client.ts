/**
 * Corporater Client
 * Calls Corporater API endpoints using the browser's existing session
 * No credentials needed - uses session cookies automatically
 */

import type { TourDefinition, ThemeColors } from '../shared/types';

export interface ClickPathApiResponse {
  success: boolean;
  tours?: TourDefinition[];
  colors?: Partial<ThemeColors>;
  config?: {
    enableAutoStart?: boolean;
    enableHelpButton?: boolean;
    enableKeyboardShortcuts?: boolean;
  };
  progress?: Record<string, {
    status: string;
    currentStepId?: string;
    percentComplete: number;
  }>;
  error?: string;
}

/**
 * Get the base URL for the current Corporater instance
 * Works by detecting the URL pattern from the current page
 */
export function getCorporaterBaseUrl(): string | null {
  // This will be called from content script context
  // Default to relative URL which works when on a Corporater page
  return '';
}

/**
 * Fetch tours, colors, and config from Corporater endpoint
 * Uses browser session cookies - no credentials needed
 */
export async function fetchClickPathData(baseUrl: string = ''): Promise<ClickPathApiResponse> {
  try {
    // Note: endpoint without trailing slash
    const endpoint = `${baseUrl}/CorpoWebserver/api/clickpath/v1`;

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include', // Include session cookies
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Not authenticated - please log in to Corporater' };
      }
      if (response.status === 404) {
        return { success: false, error: 'ClickPath endpoint not found' };
      }
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const rawData = await response.json();

    // API returns array with single object
    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    if (!data || !data.success) {
      return { success: false, error: 'Invalid API response' };
    }

    // Parse tours from JSON string
    let tours: TourDefinition[] = [];
    if (data.tours) {
      try {
        // Tours comes as a JSON string, parse it
        const toursArray = JSON.parse(`[${data.tours}]`);
        tours = toursArray.filter((t: unknown): t is TourDefinition =>
          typeof t === 'object' && t !== null && 'id' in t
        );
      } catch (e) {
        console.warn('[ClickPath] Failed to parse tours JSON:', e);
      }
    }

    // Map colors from API response
    const colors: Partial<ThemeColors> = {
      primary: data.primary,
      primaryDark: data.primaryDark,
      primaryLight: data.primaryLight,
      background: data.background,
      text: data.text,
      textMuted: data.textMuted,
      success: data.successColor,
      warning: data.warning,
    };

    // Map config
    const config = {
      enableAutoStart: data.enableAutoStart === true,
      enableHelpButton: data.enableHelpButton === true,
    };

    return {
      success: true,
      tours,
      colors,
      config,
    };
  } catch (error) {
    console.error('[ClickPath] Failed to fetch from Corporater:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Corporater'
    };
  }
}

/**
 * Save tour progress to Corporater
 */
export async function saveProgressToCorporater(
  baseUrl: string,
  tourId: string,
  progress: {
    status: string;
    currentStepId?: string;
    percentComplete: number;
  }
): Promise<boolean> {
  try {
    const endpoint = `${baseUrl}/CorpoWebserver/api/clickpath/v1/progress`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ tourId, ...progress })
    });

    return response.ok;
  } catch (error) {
    console.error('[ClickPath] Failed to save progress:', error);
    return false;
  }
}

/**
 * Check if the ClickPath API is available
 */
export async function checkApiAvailable(baseUrl: string = ''): Promise<boolean> {
  try {
    const endpoint = `${baseUrl}/CorpoWebserver/api/clickpath/v1/status`;

    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include'
    });

    return response.ok;
  } catch {
    return false;
  }
}
