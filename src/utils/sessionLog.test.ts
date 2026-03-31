import { describe, expect, it } from 'vitest';
import { areSessionLogsEqual, buildAutoLogEntry, formatDurationLabel } from './sessionLog';
import type { ActiveSession } from '../types/timer';

const activeSession: ActiveSession = {
  startedAt: '2026-03-23T10:00:00.000Z',
  startedAtMs: Date.parse('2026-03-23T10:00:00.000Z'),
  timerMode: 'fixed',
  intendedDurationSeconds: 1200,
  elapsedSeconds: 800,
  isPaused: true,
  lastResumedAtMs: null,
  meditationType: 'Ajapa',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: true,
  intervalMinutes: 5,
  intervalSound: 'Soft Chime',
};

describe('buildAutoLogEntry', () => {
  it('creates completed auto log entries', () => {
    const log = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:20:00.000Z'),
      completedDurationSeconds: 1200,
      status: 'completed',
    });

    expect(log.status).toBe('completed');
    expect(log.source).toBe('auto log');
    expect(log.completedDurationSeconds).toBe(1200);
  });

  it('caps ended-early completed duration in valid range', () => {
    const log = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:12:00.000Z'),
      completedDurationSeconds: 2000,
      status: 'ended early',
    });

    expect(log.status).toBe('ended early');
    expect(log.completedDurationSeconds).toBe(1200);
  });

  it('clamps completed duration to 0 when calculated value is negative', () => {
    const log = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:01:00.000Z'),
      completedDurationSeconds: -30,
      status: 'ended early',
    });

    expect(log.completedDurationSeconds).toBe(0);
  });

  it('creates open-ended auto log entries without a planned duration', () => {
    const log = buildAutoLogEntry({
      session: {
        ...activeSession,
        timerMode: 'open-ended',
        intendedDurationSeconds: null,
      },
      endedAt: new Date('2026-03-23T10:12:00.000Z'),
      completedDurationSeconds: 720,
      status: 'completed',
    });

    expect(log.timerMode).toBe('open-ended');
    expect(log.intendedDurationSeconds).toBeNull();
    expect(log.completedDurationSeconds).toBe(720);
  });
});

describe('formatDurationLabel', () => {
  it('formats zero duration as zero minutes', () => {
    expect(formatDurationLabel(0)).toBe('0 min');
  });

  it('formats sub-minute durations as less than one minute', () => {
    expect(formatDurationLabel(59)).toBe('< 1 min');
  });

  it('formats non-integer minute durations with one decimal', () => {
    expect(formatDurationLabel(90)).toBe('1.5 min');
  });
});

describe('areSessionLogsEqual', () => {
  it('compares session logs by persisted fields', () => {
    const baseline = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:20:00.000Z'),
      completedDurationSeconds: 1200,
      status: 'completed',
    });

    expect(areSessionLogsEqual(baseline, { ...baseline })).toBe(true);
    expect(areSessionLogsEqual(baseline, { ...baseline, completedDurationSeconds: 600 })).toBe(false);
  });
});
