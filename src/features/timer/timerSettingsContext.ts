import { createContext, useContext } from 'react';
import type { TimerSettings } from '../../types/timer';

export interface TimerSettingsContextValue {
  readonly settings: TimerSettings;
  readonly isSettingsLoading: boolean;
  readonly isSettingsSyncing: boolean;
  readonly settingsSyncError: string | null;
  readonly setSettings: (settings: TimerSettings) => void;
}

export const TimerSettingsContext = createContext<TimerSettingsContextValue | null>(null);

export function useTimerSettings(): TimerSettingsContextValue {
  const ctx = useContext(TimerSettingsContext);
  if (!ctx) {
    throw new Error('useTimerSettings must be used inside TimerProvider');
  }
  return ctx;
}
