import type { TimerMode } from '../types/timer';

const DEFAULT_FIXED_DURATION_MINUTES = 20;

export function normalizeTimerMode(timerMode: TimerMode | undefined): TimerMode {
  return timerMode === 'open-ended' ? 'open-ended' : 'fixed';
}

export function isPositiveFiniteDuration(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function resolveLastFixedDurationMinutes(
  durationMinutes: number | null | undefined,
  lastFixedDurationMinutes: number | undefined
): number {
  if (isPositiveFiniteDuration(lastFixedDurationMinutes)) {
    return lastFixedDurationMinutes;
  }

  if (isPositiveFiniteDuration(durationMinutes)) {
    return durationMinutes;
  }

  return DEFAULT_FIXED_DURATION_MINUTES;
}

export function normalizeFixedDurationMinutes(
  timerMode: TimerMode | undefined,
  durationMinutes: number | null | undefined,
  lastFixedDurationMinutes: number | undefined
): number | null {
  if (normalizeTimerMode(timerMode) === 'open-ended') {
    return null;
  }

  if (isPositiveFiniteDuration(durationMinutes)) {
    return durationMinutes;
  }

  return resolveLastFixedDurationMinutes(durationMinutes, lastFixedDurationMinutes);
}
