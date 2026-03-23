import { describe, expect, it } from 'vitest';
import { getIntervalBellCount, validateTimerSettings } from './timerValidation';
import type { TimerSettings } from '../types/timer';

const base: TimerSettings = {
  durationMinutes: 20,
  meditationType: 'Vipassana',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
};

describe('validateTimerSettings', () => {
  it('requires duration > 0', () => {
    const result = validateTimerSettings({ ...base, durationMinutes: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.durationMinutes).toMatch(/greater than 0/i);
  });

  it('requires meditation type', () => {
    const result = validateTimerSettings({ ...base, meditationType: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.meditationType).toMatch(/required/i);
  });

  it('validates interval bell less than duration', () => {
    const result = validateTimerSettings({ ...base, intervalEnabled: true, intervalMinutes: 20 });
    expect(result.isValid).toBe(false);
    expect(result.errors.intervalMinutes).toMatch(/less than total duration/i);
  });
});

describe('getIntervalBellCount', () => {
  it('counts repeated bells without implying events after session end', () => {
    expect(getIntervalBellCount(20, 5)).toBe(3);
  });

  it('returns 0 when interval is invalid for session length', () => {
    expect(getIntervalBellCount(20, 20)).toBe(0);
  });
});
