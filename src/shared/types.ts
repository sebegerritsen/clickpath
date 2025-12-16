// Tour definition types

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlayBackground: string;
}

export interface TourDefinition {
  id: string;
  version: string;
  name: string;
  description?: string;
  trigger: TourTrigger;
  pages: TourPage[];
  settings: TourSettings;
}

export interface TourTrigger {
  mode: 'auto' | 'manual' | 'contextual';
  autoConditions?: {
    firstVisit?: boolean;
    userRole?: string[];
  };
  keyboardShortcut?: string;
}

export interface TourPage {
  urlPattern: string;
  urlMatchMode: 'regex' | 'glob' | 'exact' | 'contains';
  pageId?: string;
  waitFor?: {
    selector: string;
    timeout: number;
  };
  steps: TourStep[];
}

export interface TourStep {
  id: string;
  element?: string;
  elementFallback?: string[];
  title: string;
  content: string;
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  highlightStyle?: 'spotlight' | 'outline' | 'pulse' | 'none';
  interaction?: {
    clickThrough?: boolean;
    requiredAction?: {
      type: 'click' | 'input' | 'select' | 'wait';
      selector?: string;
      value?: string;
    };
  };
  condition?: {
    elementExists?: string;
    elementVisible?: string;
  };
  buttons?: {
    back?: { show?: boolean; label?: string };
    next?: { show?: boolean; label?: string };
    skip?: { show?: boolean; label?: string };
  };
}

export interface TourSettings {
  allowSkip: boolean;
  showProgress: boolean;
  overlayOpacity: number;
  theme: 'light' | 'dark' | 'corporater';
  spotlightPadding?: number;
  scrollBehavior?: 'smooth' | 'auto' | 'none';
}

// Runtime state types

export interface TourState {
  tourId: string;
  currentPageIndex: number;
  currentStepIndex: number;
  startedAt: number;
  lastActivityAt: number;
}

export interface TourProgress {
  tourId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  currentStepId?: string;
  percentComplete: number;
  completedAt?: number;
}

// Message types for extension communication

export type MessageType =
  | { type: 'PING' }
  | { type: 'START_TOUR'; tourId: string }
  | { type: 'STOP_TOUR' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SKIP_TOUR' }
  | { type: 'GET_TOURS' }
  | { type: 'GET_STATE' }
  | { type: 'GET_THEME' }
  | { type: 'SET_THEME'; colors: Partial<ThemeColors> }
  | { type: 'SAVE_PROGRESS'; progress: TourProgress }
  | { type: 'TOUR_COMPLETED'; tourId: string }
  | { type: 'FETCH_TOURS_FROM_CORPORATER' }
  | { type: 'SYNC_PROGRESS' };

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
