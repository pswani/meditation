import type { TimerSettings } from '../../types/timer';
import { normalizeTimerSettings } from '../timerSettingsNormalization';
import { isTimerSettings, TIMER_SETTINGS_KEY } from './shared';
import { safeSetItem } from './safeSetItem';

export function loadTimerSettings(): TimerSettings | null {
  const raw = localStorage.getItem(TIMER_SETTINGS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTimerSettings(parsed)) {
      return null;
    }

    return normalizeTimerSettings(parsed);
  } catch {
    return null;
  }
}

export function saveTimerSettings(settings: TimerSettings): void {
  safeSetItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
}
