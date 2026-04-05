import type { SessionLog } from '../../types/sessionLog';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_INTERVAL_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from '../timerSound';
import { isSessionLog, SESSION_LOGS_KEY } from './shared';

export function loadSessionLogs(): SessionLog[] {
  const raw = localStorage.getItem(SESSION_LOGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter(isSessionLog)
          .map((entry) => ({
            ...entry,
            timerMode: entry.timerMode ?? 'fixed',
            startSound: normalizeTimerSoundLabel(entry.startSound, DEFAULT_START_SOUND_LABEL),
            endSound: normalizeTimerSoundLabel(entry.endSound, DEFAULT_END_SOUND_LABEL),
            intervalSound: normalizeTimerSoundLabel(entry.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
            customPlayId: entry.customPlayId ?? undefined,
            customPlayName: entry.customPlayName ?? undefined,
            customPlayRecordingLabel: entry.customPlayRecordingLabel ?? undefined,
          }))
      : [];
  } catch {
    return [];
  }
}

export function saveSessionLogs(logs: readonly SessionLog[]): void {
  localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs));
}
