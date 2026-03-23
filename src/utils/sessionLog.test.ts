import { describe, expect, it } from 'vitest';
import { buildAutoLogEntry } from './sessionLog';
import type { ActiveSession } from '../types/timer';

const activeSession: ActiveSession = {
  startedAt: '2026-03-23T10:00:00.000Z',
  startedAtMs: Date.parse('2026-03-23T10:00:00.000Z'),
  intendedDurationSeconds: 1200,
  remainingSeconds: 400,
  meditationType: 'Ajapa',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: true,
  intervalMinutes: 5,
  endAtMs: Date.parse('2026-03-23T10:20:00.000Z'),
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
});
