import type { TimerMode, TimerSettings } from '../types/timer';

const DEFAULT_FIXED_DURATION_MINUTES = 20;

type TimerSettingsLike = Pick<
  TimerSettings,
  'meditationType' | 'startSound' | 'endSound' | 'intervalEnabled' | 'intervalMinutes'
> & {
  readonly timerMode?: TimerMode;
  readonly durationMinutes?: number | null;
  readonly lastFixedDurationMinutes?: number;
  readonly intervalSound?: string;
};

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

export function normalizeTimerSettings(settings: TimerSettingsLike): TimerSettings {
  const timerMode = normalizeTimerMode(settings.timerMode);

  return {
    timerMode,
    durationMinutes: normalizeFixedDurationMinutes(timerMode, settings.durationMinutes, settings.lastFixedDurationMinutes),
    lastFixedDurationMinutes: resolveLastFixedDurationMinutes(settings.durationMinutes, settings.lastFixedDurationMinutes),
    meditationType: settings.meditationType,
    startSound: settings.startSound,
    endSound: settings.endSound,
    intervalEnabled: settings.intervalEnabled,
    intervalMinutes: settings.intervalMinutes,
    intervalSound: settings.intervalSound ?? 'Temple Bell',
  };
}
