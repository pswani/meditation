import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { TimerState, TimerAction } from './timerReducer';

export interface TimerStateContextValue {
  readonly state: TimerState;
  readonly dispatch: Dispatch<TimerAction>;
  readonly isPaused: boolean;
}

export const TimerStateContext = createContext<TimerStateContextValue | null>(null);

export function useTimerState(): TimerStateContextValue {
  const ctx = useContext(TimerStateContext);
  if (!ctx) {
    throw new Error('useTimerState must be used inside TimerProvider');
  }
  return ctx;
}
