import { createContext } from 'react';
import type { CustomPlay, CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import type { SessionLog } from '../../types/sessionLog';
import type { TimerSettings } from '../../types/timer';
import type { createInitialTimerState } from './timerReducer';
import type { ManualLogInput, ManualLogValidationResult } from '../../utils/manualLog';

export interface TimerContextValue {
  readonly settings: TimerSettings;
  readonly validation: ReturnType<typeof createInitialTimerState>['validation'];
  readonly activeSession: ReturnType<typeof createInitialTimerState>['activeSession'];
  readonly lastOutcome: ReturnType<typeof createInitialTimerState>['lastOutcome'];
  readonly recentLogs: readonly SessionLog[];
  readonly customPlays: readonly CustomPlay[];
  readonly isPaused: boolean;
  readonly setSettings: (settings: TimerSettings) => void;
  readonly saveCustomPlay: (draft: CustomPlayDraft, editId?: string) => CustomPlayValidationResult;
  readonly deleteCustomPlay: (playId: string) => void;
  readonly toggleFavoriteCustomPlay: (playId: string) => void;
  readonly addManualLog: (input: ManualLogInput) => ManualLogValidationResult;
  readonly startSession: () => boolean;
  readonly pauseSession: () => void;
  readonly resumeSession: () => void;
  readonly endSessionEarly: () => void;
  readonly clearOutcome: () => void;
}

export const TimerContext = createContext<TimerContextValue | null>(null);
