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
  lastResumedAtPerformanceMs: 0,
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

  it('uses performance clock when available', () => {
    // performance reference: session resumed at 0ms, 45s have passed on the monotonic clock
    const nowPerformanceMs = 45_000;
    // wall clock went backward (NTP correction) — should be ignored
    const nowMs = Date.parse('2026-03-30T12:05:00.000Z') - 500;

    expect(getActiveSessionElapsedSeconds(baseSession, nowMs, nowPerformanceMs)).toBe(165); // 120 + 45
  });

  it('falls back to wall clock when performance reference is absent', () => {
    const sessionWithoutPerfRef: ActiveSession = {
      ...baseSession,
      lastResumedAtPerformanceMs: null,
    };
    const nowMs = Date.parse('2026-03-30T12:05:45.000Z');

    expect(getActiveSessionElapsedSeconds(sessionWithoutPerfRef, nowMs)).toBe(165);
  });

  it('preserves elapsed time while an open-ended session is paused', () => {
    const pausedSession: ActiveSession = {
      ...baseSession,
      elapsedSeconds: 210,
      isPaused: true,
      lastResumedAtMs: null,
      lastResumedAtPerformanceMs: null,
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

  it('uses performance clock for remaining time calculation on fixed sessions', () => {
    const fixedSession: ActiveSession = {
      ...baseSession,
      timerMode: 'fixed',
      intendedDurationSeconds: 900,
      elapsedSeconds: 300,
      lastResumedAtPerformanceMs: 0,
    };

    // 30s on monotonic clock; wall clock irrelevant
    expect(getActiveSessionRemainingSeconds(fixedSession, 0, 30_000)).toBe(570); // 900 - (300 + 30)
  });
});
