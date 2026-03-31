import { describe, expect, it } from 'vitest';
import { getIntervalBellCount, validateTimerSettings } from './timerValidation';
import type { TimerSettings } from '../types/timer';

const base: TimerSettings = {
  timerMode: 'fixed',
  durationMinutes: 20,
  lastFixedDurationMinutes: 20,
  meditationType: 'Vipassana',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
};

describe('validateTimerSettings', () => {
  it('accepts a valid timer setup with interval bells enabled', () => {
    const result = validateTimerSettings({ ...base, intervalEnabled: true, intervalMinutes: 5 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('requires duration > 0', () => {
    const result = validateTimerSettings({ ...base, durationMinutes: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.durationMinutes).toMatch(/greater than 0/i);
  });

  it('rejects fixed mode when the current duration is missing even if a last fixed fallback exists', () => {
    const result = validateTimerSettings({ ...base, durationMinutes: null, lastFixedDurationMinutes: 20 });
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

  it('requires interval bell value greater than 0 when enabled', () => {
    const result = validateTimerSettings({ ...base, intervalEnabled: true, intervalMinutes: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.intervalMinutes).toMatch(/greater than 0/i);
  });

  it('allows open-ended mode without a fixed duration', () => {
    const result = validateTimerSettings({ ...base, timerMode: 'open-ended', durationMinutes: 0, intervalEnabled: true, intervalMinutes: 5 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects non-finite interval values when interval bells are enabled', () => {
    const result = validateTimerSettings({ ...base, intervalEnabled: true, intervalMinutes: Number.POSITIVE_INFINITY });
    expect(result.isValid).toBe(false);
    expect(result.errors.intervalMinutes).toMatch(/greater than 0/i);
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
