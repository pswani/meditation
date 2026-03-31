import { describe, expect, it } from 'vitest';
import type { ActiveSession } from '../../types/timer';
import {
  getActiveSessionClockSeconds,
  getActiveSessionElapsedSeconds,
  getActiveSessionRemainingSeconds,
} from './time';

const baseSession: ActiveSession = {
  startedAt: '2026-03-30T12:00:00.000Z',
  startedAtMs: Date.parse('2026-03-30T12:00:00.000Z'),
  timerMode: 'open-ended',
  intendedDurationSeconds: null,
  elapsedSeconds: 120,
  isPaused: false,
  lastResumedAtMs: Date.parse('2026-03-30T12:05:00.000Z'),
  meditationType: 'Vipassana',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: true,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
};

describe('timer time helpers', () => {
  it('advances open-ended elapsed time while the session is running', () => {
    const nowMs = Date.parse('2026-03-30T12:05:45.000Z');

    expect(getActiveSessionElapsedSeconds(baseSession, nowMs)).toBe(165);
    expect(getActiveSessionClockSeconds(baseSession, nowMs)).toBe(165);
  });

  it('preserves elapsed time while an open-ended session is paused', () => {
    const pausedSession: ActiveSession = {
      ...baseSession,
      elapsedSeconds: 210,
      isPaused: true,
      lastResumedAtMs: null,
    };

    const nowMs = Date.parse('2026-03-30T12:10:00.000Z');
    expect(getActiveSessionElapsedSeconds(pausedSession, nowMs)).toBe(210);
    expect(getActiveSessionClockSeconds(pausedSession, nowMs)).toBe(210);
  });

  it('continues to report remaining time for fixed sessions', () => {
    const fixedSession: ActiveSession = {
      ...baseSession,
      timerMode: 'fixed',
      intendedDurationSeconds: 900,
      elapsedSeconds: 300,
    };

    const nowMs = Date.parse('2026-03-30T12:05:30.000Z');
    expect(getActiveSessionRemainingSeconds(fixedSession, nowMs)).toBe(570);
    expect(getActiveSessionClockSeconds(fixedSession, nowMs)).toBe(570);
  });
});
