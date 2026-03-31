import type { TimerSettings, TimerValidationResult } from '../types/timer';
import { isPositiveFiniteDuration } from './timerSettingsNormalization';

export function validateTimerSettings(settings: TimerSettings): TimerValidationResult {
  const errors: TimerValidationResult['errors'] = {};
  const hasValidFixedDuration = isPositiveFiniteDuration(settings.durationMinutes);
  const fixedDurationMinutes = hasValidFixedDuration ? settings.durationMinutes : null;

  if (settings.timerMode === 'fixed' && !hasValidFixedDuration) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }

  if (!settings.meditationType) {
    errors.meditationType = 'Meditation type is required.';
  }

  if (settings.intervalEnabled) {
    if (!isPositiveFiniteDuration(settings.intervalMinutes)) {
      errors.intervalMinutes = 'Interval bell must be greater than 0.';
    } else if (settings.timerMode === 'fixed' && fixedDurationMinutes !== null && settings.intervalMinutes >= fixedDurationMinutes) {
      errors.intervalMinutes = 'Each interval bell must be less than total duration.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getIntervalBellCount(durationMinutes: number, intervalMinutes: number): number {
  if (intervalMinutes <= 0 || intervalMinutes >= durationMinutes) {
    return 0;
  }

  return Math.floor((durationMinutes * 60 - 1) / (intervalMinutes * 60));
}
