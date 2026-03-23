import { createContext } from 'react';
import type { SessionLog } from '../../types/sessionLog';
import type { TimerSettings } from '../../types/timer';
import type { createInitialTimerState } from './timerReducer';

export interface TimerContextValue {
  readonly settings: TimerSettings;
  readonly validation: ReturnType<typeof createInitialTimerState>['validation'];
  readonly activeSession: ReturnType<typeof createInitialTimerState>['activeSession'];
  readonly lastOutcome: ReturnType<typeof createInitialTimerState>['lastOutcome'];
  readonly recentLogs: readonly SessionLog[];
  readonly isPaused: boolean;
  readonly setSettings: (settings: TimerSettings) => void;
  readonly startSession: () => boolean;
  readonly pauseSession: () => void;
  readonly resumeSession: () => void;
  readonly endSessionEarly: () => void;
  readonly clearOutcome: () => void;
}

export const TimerContext = createContext<TimerContextValue | null>(null);
