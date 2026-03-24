import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../../types/sessionLog';
import type { TimerSettings } from '../../types/timer';
import { createInitialTimerState, timerReducer } from './timerReducer';

const validSettings: TimerSettings = {
  durationMinutes: 10,
  meditationType: 'Kriya',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: true,
  intervalMinutes: 2,
  intervalSound: 'Temple Bell',
};

function createSessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: 'log-default',
    startedAt: '2026-03-23T10:00:00.000Z',
    endedAt: '2026-03-23T10:10:00.000Z',
    meditationType: 'Vipassana',
    intendedDurationSeconds: 600,
    completedDurationSeconds: 600,
    status: 'completed',
    source: 'auto log',
    startSound: 'None',
    endSound: 'Temple Bell',
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
    ...overrides,
  };
}

describe('timerReducer', () => {
  it('does not start a session when settings are invalid', () => {
    const state = createInitialTimerState({ ...validSettings, meditationType: '' }, []);
    const next = timerReducer(state, { type: 'START_SESSION', nowMs: Date.parse('2026-03-23T10:00:00.000Z') });

    expect(next.activeSession).toBeNull();
    expect(next.validation.isValid).toBe(false);
    expect(next.validation.errors.meditationType).toMatch(/required/i);
  });

  it('starts a session when settings are valid', () => {
    const state = createInitialTimerState(validSettings, []);
    const next = timerReducer(state, { type: 'START_SESSION', nowMs: Date.parse('2026-03-23T10:00:00.000Z') });

    expect(next.activeSession).not.toBeNull();
    expect(next.activeSession?.remainingSeconds).toBe(600);
  });

  it('preserves remaining time on pause and resume baseline', () => {
    const started = timerReducer(createInitialTimerState(validSettings, []), {
      type: 'START_SESSION',
      nowMs: Date.parse('2026-03-23T10:00:00.000Z'),
    });

    const paused = timerReducer(started, {
      type: 'PAUSE_SESSION',
      nowMs: Date.parse('2026-03-23T10:03:00.000Z'),
    });

    expect(paused.activeSession?.remainingSeconds).toBe(420);

    const resumed = timerReducer(paused, {
      type: 'RESUME_SESSION',
      nowMs: Date.parse('2026-03-23T10:05:00.000Z'),
    });

    expect(resumed.activeSession?.endAtMs).toBe(Date.parse('2026-03-23T10:12:00.000Z'));
  });

  it('creates ended early auto log with actual completed duration', () => {
    const started = timerReducer(createInitialTimerState(validSettings, []), {
      type: 'START_SESSION',
      nowMs: Date.parse('2026-03-23T10:00:00.000Z'),
    });

    const ended = timerReducer(started, {
      type: 'END_EARLY',
      nowMs: Date.parse('2026-03-23T10:04:00.000Z'),
    });

    expect(ended.activeSession).toBeNull();
    expect(ended.sessionLogs[0].status).toBe('ended early');
    expect(ended.sessionLogs[0].completedDurationSeconds).toBe(240);
  });

  it('finalizes a completed auto log when sync tick reaches end', () => {
    const started = timerReducer(createInitialTimerState(validSettings, []), {
      type: 'START_SESSION',
      nowMs: Date.parse('2026-03-23T10:00:00.000Z'),
    });

    const completed = timerReducer(started, {
      type: 'SYNC_TICK',
      nowMs: Date.parse('2026-03-23T10:10:00.000Z'),
    });

    expect(completed.activeSession).toBeNull();
    expect(completed.lastOutcome?.status).toBe('completed');
    expect(completed.sessionLogs[0].status).toBe('completed');
    expect(completed.sessionLogs[0].completedDurationSeconds).toBe(600);
  });

  it('keeps history ordered by endedAt recency when manual backfill is added', () => {
    const newerAutoLog = createSessionLog({
      id: 'log-newer',
      endedAt: '2026-03-23T12:00:00.000Z',
    });
    const state = createInitialTimerState(validSettings, [newerAutoLog]);

    const olderManualLog = createSessionLog({
      id: 'log-older-manual',
      startedAt: '2026-03-23T08:30:00.000Z',
      endedAt: '2026-03-23T09:00:00.000Z',
      source: 'manual log',
      meditationType: 'Ajapa',
    });

    const next = timerReducer(state, {
      type: 'ADD_SESSION_LOG',
      payload: olderManualLog,
    });

    expect(next.sessionLogs.map((entry) => entry.id)).toEqual(['log-newer', 'log-older-manual']);
  });
});
