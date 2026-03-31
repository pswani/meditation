import type { TimerSettings, TimerValidationResult } from '../types/timer';

export function validateTimerSettings(settings: TimerSettings): TimerValidationResult {
  const errors: TimerValidationResult['errors'] = {};
  const fixedDurationMinutes = settings.durationMinutes ?? settings.lastFixedDurationMinutes;

  if (settings.timerMode === 'fixed' && (Number.isNaN(fixedDurationMinutes) || fixedDurationMinutes <= 0)) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }

  if (!settings.meditationType) {
    errors.meditationType = 'Meditation type is required.';
  }

  if (settings.intervalEnabled) {
    if (Number.isNaN(settings.intervalMinutes) || settings.intervalMinutes <= 0) {
      errors.intervalMinutes = 'Interval bell must be greater than 0.';
    } else if (settings.timerMode === 'fixed' && settings.intervalMinutes >= fixedDurationMinutes) {
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
