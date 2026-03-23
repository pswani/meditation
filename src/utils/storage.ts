import type { SessionLog } from '../types/sessionLog';
import type { TimerSettings } from '../types/timer';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';

function isTimerSettings(value: unknown): value is TimerSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.durationMinutes === 'number' &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    typeof candidate.intervalMinutes === 'number' &&
    (typeof candidate.intervalSound === 'string' || typeof candidate.intervalSound === 'undefined')
  );
}

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

    return {
      ...parsed,
      intervalSound: parsed.intervalSound ?? 'Temple Bell',
    };
  } catch {
    return null;
  }
}

export function saveTimerSettings(settings: TimerSettings): void {
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSessionLogs(): SessionLog[] {
  const raw = localStorage.getItem(SESSION_LOGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionLog[]) : [];
  } catch {
    return [];
  }
}

export function saveSessionLogs(logs: SessionLog[]): void {
  localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs));
}
