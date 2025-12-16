/**
 * Corporater ClickPath Content Script
 * Injected into Corporater pages to provide guided tours
 * Fetches tours directly from Corporater API using session cookies
 */

import { TourEngine } from './tour-engine';
import type { TourDefinition, MessageType, MessageResponse, ThemeColors } from '../shared/types';

// API response is an array with flat structure (from Corporater table output)
interface ClickPathApiRecord {
  success: boolean;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  text: string;
  textMuted: string;
  successColor: string;
  warning: string;
  enableAutoStart: boolean;
  enableHelpButton: boolean;
  user: string;
  tours: string; // JSON string containing tour definitions
}

type ClickPathApiResponse = ClickPathApiRecord[];

class ClickPathContent {
  private tourEngine: TourEngine | null = null;
  private tours: TourDefinition[] = [];
  private config = {
    enableAutoStart: true,
    enableHelpButton: true
  };

  constructor() {
    this.init();
  }

  private async init() {
    console.log('[ClickPath] Content script initialized on:', window.location.href);

    // Apply any cached theme immediately
    await this.applyCachedTheme();

    // Load tours from Corporater API
    await this.loadFromCorporater();

    // Fall back to bundled tours if API fails
    if (this.tours.length === 0) {
      await this.loadBundledTours();
    }

    // Set up message listener for popup/background communication
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Check for auto-start tours
    if (this.config.enableAutoStart) {
      this.checkAutoStart();
    }

    // Inject floating help button
    if (this.config.enableHelpButton) {
      this.injectHelpButton();
    }
  }

  /**
   * Fetch config and colors directly from Corporater API
   * Uses browser session cookies - no credentials needed
   */
  private async loadFromCorporater(): Promise<void> {
    try {
      // Build endpoint URL (relative to current page, no trailing slash)
      const endpoint = '/CorpoWebserver/api/clickpath/v1';

      console.log('[ClickPath] Fetching from Corporater API:', endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`[ClickPath] API returned ${response.status}`);
        return;
      }

      const data: ClickPathApiResponse = await response.json();

      // API returns array with single record
      if (data && data.length > 0 && data[0].success) {
        const record = data[0];
        console.log(`[ClickPath] Loaded config from Corporater for user: ${record.user}`);

        // Parse tours from JSON string
        if (record.tours) {
          try {
            // Tours field is a comma-joined string of JSON objects
            const toursArray = JSON.parse(`[${record.tours}]`);
            this.tours = toursArray.filter((t: unknown): t is TourDefinition =>
              typeof t === 'object' && t !== null && 'id' in t
            );
            console.log(`[ClickPath] Loaded ${this.tours.length} tours from API`);
            chrome.storage.local.set({ cachedTours: this.tours });
          } catch (e) {
            console.warn('[ClickPath] Failed to parse tours JSON:', e);
          }
        }

        // Apply colors (map flat structure to theme colors)
        const colors: Partial<ThemeColors> = {
          primary: record.primary,
          primaryDark: record.primaryDark,
          primaryLight: record.primaryLight,
          background: record.background,
          text: record.text,
          textMuted: record.textMuted,
          success: record.successColor, // Note: API field is 'successColor'
          warning: record.warning
        };
        this.applyTheme(colors);
        chrome.storage.local.set({ cachedColors: colors });

        // Apply config
        this.config = {
          enableAutoStart: record.enableAutoStart,
          enableHelpButton: record.enableHelpButton
        };
        chrome.storage.local.set({ cachedConfig: this.config });
      }
    } catch (error) {
      console.warn('[ClickPath] Failed to load from Corporater API:', error);

      // Try to use cached data
      const cached = await chrome.storage.local.get(['cachedTours', 'cachedColors', 'cachedConfig']);
      if (cached.cachedTours) {
        this.tours = cached.cachedTours;
        console.log(`[ClickPath] Using ${this.tours.length} cached tours`);
      }
      if (cached.cachedColors) {
        this.applyTheme(cached.cachedColors);
      }
      if (cached.cachedConfig) {
        this.config = { ...this.config, ...cached.cachedConfig };
      }
    }
  }

  /**
   * Apply cached theme colors immediately on load
   */
  private async applyCachedTheme(): Promise<void> {
    try {
      const cached = await chrome.storage.local.get('cachedColors');
      if (cached.cachedColors) {
        this.applyTheme(cached.cachedColors);
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Apply theme colors as CSS variables
   */
  private applyTheme(colors: Partial<ThemeColors>): void {
    const root = document.documentElement;

    if (colors.primary) root.style.setProperty('--clickpath-primary', colors.primary);
    if (colors.primaryDark) root.style.setProperty('--clickpath-primary-dark', colors.primaryDark);
    if (colors.primaryLight) root.style.setProperty('--clickpath-primary-light', colors.primaryLight);
    if (colors.background) root.style.setProperty('--clickpath-background', colors.background);
    if (colors.text) root.style.setProperty('--clickpath-text', colors.text);
    if (colors.textMuted) root.style.setProperty('--clickpath-text-muted', colors.textMuted);
    if (colors.success) root.style.setProperty('--clickpath-success', colors.success);
    if (colors.warning) root.style.setProperty('--clickpath-warning', colors.warning);

    console.log('[ClickPath] Applied theme colors:', colors);
  }

  /**
   * Load bundled example tours as fallback
   */
  private async loadBundledTours(): Promise<void> {
    try {
      const response = await fetch(chrome.runtime.getURL('tours/example-tour.json'));
      if (response.ok) {
        const tour = await response.json();
        this.tours = [tour];
        console.log('[ClickPath] Loaded bundled example tour');
      }
    } catch (error) {
      console.error('[ClickPath] Failed to load bundled tours:', error);
    }
  }

  private handleMessage(
    message: MessageType,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true, data: { installed: true } });
        break;

      case 'START_TOUR':
        this.startTour(message.tourId);
        sendResponse({ success: true });
        break;

      case 'STOP_TOUR':
        this.stopTour();
        sendResponse({ success: true });
        break;

      case 'GET_TOURS':
        sendResponse({
          success: true,
          data: this.tours.map(t => ({ id: t.id, name: t.name, description: t.description }))
        });
        break;

      case 'GET_STATE':
        sendResponse({
          success: true,
          data: this.tourEngine?.getState() ?? null
        });
        break;

      case 'FETCH_TOURS_FROM_CORPORATER':
        this.loadFromCorporater().then(() => {
          sendResponse({ success: true, data: this.tours });
        });
        return true; // Keep channel open for async

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    return true;
  }

  private checkAutoStart(): void {
    const currentUrl = window.location.href;

    for (const tour of this.tours) {
      if (tour.trigger.mode !== 'auto') continue;

      // Find matching page
      const matchingPage = tour.pages.find(page => this.matchUrl(currentUrl, page));
      if (!matchingPage) continue;

      // Check auto conditions
      if (tour.trigger.autoConditions?.firstVisit) {
        const completedKey = `tour_completed_${tour.id}`;
        chrome.storage.local.get(completedKey, (result) => {
          if (!result[completedKey]) {
            console.log(`[ClickPath] Auto-starting tour: ${tour.name}`);
            setTimeout(() => this.startTour(tour.id), 1000);
          }
        });
      }
    }
  }

  private matchUrl(url: string, page: { urlPattern: string; urlMatchMode: string }): boolean {
    switch (page.urlMatchMode) {
      case 'exact':
        return url === page.urlPattern;
      case 'contains':
        return url.includes(page.urlPattern);
      case 'regex':
        return new RegExp(page.urlPattern).test(url);
      case 'glob':
        const pattern = page.urlPattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        return new RegExp(`^${pattern}$`).test(url);
      default:
        return url.includes(page.urlPattern);
    }
  }

  private startTour(tourId: string): void {
    const tour = tourId
      ? this.tours.find(t => t.id === tourId)
      : this.tours.find(t => t.pages.some(p => this.matchUrl(window.location.href, p)));

    if (!tour) {
      console.error(`[ClickPath] Tour not found: ${tourId || 'for current page'}`);
      return;
    }

    const currentUrl = window.location.href;
    const pageIndex = tour.pages.findIndex(page => this.matchUrl(currentUrl, page));

    if (pageIndex === -1) {
      console.warn(`[ClickPath] No matching page for current URL in tour: ${tour.id}`);
      return;
    }

    this.stopTour();
    this.tourEngine = new TourEngine(tour, pageIndex);
    this.tourEngine.start();
  }

  private stopTour(): void {
    if (this.tourEngine) {
      this.tourEngine.stop();
      this.tourEngine = null;
    }
  }

  private injectHelpButton(): void {
    const currentUrl = window.location.href;
    const hasTours = this.tours.some(tour =>
      tour.pages.some(page => this.matchUrl(currentUrl, page))
    );

    if (!hasTours && this.tours.length === 0) {
      // Always show button if we have any tours (might match later)
      // Or show if we couldn't load tours yet
    }

    // Remove existing button if any
    document.querySelector('.clickpath-help-button')?.remove();

    const button = document.createElement('button');
    button.className = 'clickpath-help-button';
    button.innerHTML = '?';
    button.title = 'Start guided tour (Ctrl+Shift+T)';
    button.addEventListener('click', () => {
      const tour = this.tours.find(t =>
        t.pages.some(page => this.matchUrl(currentUrl, page))
      );
      if (tour) {
        this.startTour(tour.id);
      } else if (this.tours.length > 0) {
        // Start first available tour
        this.startTour(this.tours[0].id);
      }
    });

    document.body.appendChild(button);
  }
}

// Initialize content script
new ClickPathContent();
