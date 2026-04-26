import { createContext, useContext } from 'react';
import type { TimerSettings } from '../../types/timer';

export interface TimerActionsContextValue {
  readonly timerSoundPlaybackMessage: string | null;
  readonly recoveryMessage: string | null;
  readonly startSession: (settings?: TimerSettings) => boolean;
  readonly pauseSession: () => void;
  readonly resumeSession: () => void;
  readonly endSessionEarly: () => void;
  readonly clearOutcome: () => void;
  readonly clearTimerSoundPlaybackMessage: () => void;
  readonly clearRecoveryMessage: () => void;
}

export const TimerActionsContext = createContext<TimerActionsContextValue | null>(null);

export function useTimerActions(): TimerActionsContextValue {
  const ctx = useContext(TimerActionsContext);
  if (!ctx) {
    throw new Error('useTimerActions must be used inside TimerProvider');
  }
  return ctx;
}
