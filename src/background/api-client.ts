/**
 * Corporater API Client
 * Handles communication with Corporater for tours and progress
 */

import type { TourDefinition, TourProgress, ThemeColors } from '../shared/types';

export interface CorporaterConfig {
  apiUrl: string;  // Extended API endpoint (e.g., http://localhost:3200)
  serverUrl: string;  // Corporater server URL
  username?: string;
  password?: string;
}

export interface CorporaterTourObject {
  rid: string;
  id: string;
  name: string;
  CP_TourId: string;
  CP_Version: string;
  CP_TourDefinition: string;  // JSON string
  CP_Status: string;
  CP_AutoRoles?: string;
  CP_Priority?: number;
}

export interface CorporaterProgressObject {
  rid: string;
  id: string;
  CP_Status: string;
  CP_CurrentStepId?: string;
  CP_PercentComplete: number;
  CP_CompletedAt?: string;
}

export interface CorporaterThemeObject {
  CP_PrimaryColor?: string;
  CP_PrimaryDark?: string;
  CP_PrimaryLight?: string;
  CP_BackgroundColor?: string;
  CP_TextColor?: string;
}

/**
 * Execute Extended expression via API
 */
async function executeExtended(
  config: CorporaterConfig,
  expression: string,
  commit: boolean = false
): Promise<unknown> {
  const response = await fetch(`${config.apiUrl}/api/external/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serverUrl: config.serverUrl,
      username: config.username,
      password: config.password,
      expression,
      commit
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all active tours from Corporater
 */
export async function fetchTours(config: CorporaterConfig): Promise<TourDefinition[]> {
  try {
    // Query ClickPath tour objects
    const expression = `
      SELECT ceRootObject
      WHERE id.startsWith("CPT_")
      AND CP_Status = t.CP_Status_Active
      .table(rid, id, name, CP_TourId, CP_Version, CP_TourDefinition, CP_AutoRoles, CP_Priority)
    `;

    const result = await executeExtended(config, expression) as string[][];

    if (!result || result.length <= 1) {
      console.log('[ClickPath] No tours found in Corporater');
      return [];
    }

    // Parse tour objects (skip header row)
    const tours: TourDefinition[] = [];
    for (const row of result.slice(1)) {
      try {
        const tourJson = row[5]; // CP_TourDefinition column
        if (tourJson) {
          const tour = JSON.parse(tourJson) as TourDefinition;
          tours.push(tour);
        }
      } catch (e) {
        console.warn('[ClickPath] Failed to parse tour:', row[1], e);
      }
    }

    console.log(`[ClickPath] Loaded ${tours.length} tours from Corporater`);
    return tours;
  } catch (error) {
    console.error('[ClickPath] Failed to fetch tours from Corporater:', error);
    return [];
  }
}

/**
 * Fetch user's progress for all tours
 */
export async function fetchProgress(config: CorporaterConfig): Promise<Map<string, TourProgress>> {
  try {
    const expression = `
      SELECT ceRootObject
      WHERE id.startsWith("CPP_") AND CP_User = this.user
      .table(rid, id, CP_Tour.CP_TourId, CP_Status, CP_CurrentStepId, CP_PercentComplete, CP_CompletedAt)
    `;

    const result = await executeExtended(config, expression) as string[][];
    const progressMap = new Map<string, TourProgress>();

    if (!result || result.length <= 1) {
      return progressMap;
    }

    for (const row of result.slice(1)) {
      const tourId = row[2];
      progressMap.set(tourId, {
        tourId,
        status: row[3] as TourProgress['status'],
        currentStepId: row[4],
        percentComplete: parseFloat(row[5]) || 0,
        completedAt: row[6] ? new Date(row[6]).getTime() : undefined
      });
    }

    return progressMap;
  } catch (error) {
    console.error('[ClickPath] Failed to fetch progress:', error);
    return new Map();
  }
}

/**
 * Save user progress to Corporater
 */
export async function saveProgress(
  config: CorporaterConfig,
  tourId: string,
  progress: TourProgress
): Promise<boolean> {
  try {
    // Create or update progress object
    const progressId = `CPP_${tourId}`;  // Will include user ID from this.user

    const expression = `
      vExisting := SELECT ceRootObject WHERE id.startsWith("${progressId}") AND CP_User = this.user;

      IF vExisting.isEmpty() THEN
        root.ce.add(ceRootObject,
          id := "${progressId}_" + this.user.id,
          name := "Progress: " + this.user.name + " - ${tourId}",
          CP_User := this.user,
          CP_TourId := "${tourId}",
          CP_Status := t.CP_Progress_${progress.status === 'completed' ? 'Completed' : progress.status === 'skipped' ? 'Skipped' : 'InProgress'},
          CP_CurrentStepId := "${progress.currentStepId || ''}",
          CP_PercentComplete := ${progress.percentComplete},
          CP_LastActivityAt := now()
          ${progress.completedAt ? `, CP_CompletedAt := now()` : ''}
        )
      ELSE
        vExisting.first().change(
          CP_Status := t.CP_Progress_${progress.status === 'completed' ? 'Completed' : progress.status === 'skipped' ? 'Skipped' : 'InProgress'},
          CP_CurrentStepId := "${progress.currentStepId || ''}",
          CP_PercentComplete := ${progress.percentComplete},
          CP_LastActivityAt := now()
          ${progress.completedAt ? `, CP_CompletedAt := now()` : ''}
        )
      ENDIF
    `;

    await executeExtended(config, expression, true);
    console.log(`[ClickPath] Saved progress for tour: ${tourId}`);
    return true;
  } catch (error) {
    console.error('[ClickPath] Failed to save progress:', error);
    return false;
  }
}

/**
 * Fetch theme colors from Corporater (if configured)
 */
export async function fetchThemeColors(config: CorporaterConfig): Promise<Partial<ThemeColors> | null> {
  try {
    // Look for a ClickPath config object with theme settings
    const expression = `
      SELECT ceRootObject WHERE id = "ClickPath_Config"
      .table(CP_PrimaryColor, CP_PrimaryDark, CP_PrimaryLight, CP_BackgroundColor, CP_TextColor)
    `;

    const result = await executeExtended(config, expression) as string[][];

    if (!result || result.length <= 1) {
      return null;
    }

    const row = result[1];
    const colors: Partial<ThemeColors> = {};

    if (row[0]) colors.primary = row[0];
    if (row[1]) colors.primaryDark = row[1];
    if (row[2]) colors.primaryLight = row[2];
    if (row[3]) colors.background = row[3];
    if (row[4]) colors.text = row[4];

    return Object.keys(colors).length > 0 ? colors : null;
  } catch (error) {
    console.log('[ClickPath] No custom theme found in Corporater');
    return null;
  }
}

/**
 * Check if API is reachable
 */
export async function checkConnection(config: CorporaterConfig): Promise<boolean> {
  try {
    const expression = 'TRUE';
    await executeExtended(config, expression);
    return true;
  } catch {
    return false;
  }
}
