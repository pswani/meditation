import type { ActiveCustomPlayRun } from '../types/customPlay';
import { describe, expect, it } from 'vitest';
import {
  areSessionLogsEqual,
  buildAutoLogEntry,
  buildCustomPlayLogEntry,
  canChangeSessionLogMeditationType,
  formatDurationLabel,
  updateSessionLogMeditationType,
} from './sessionLog';
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

const activeCustomPlayRun: ActiveCustomPlayRun = {
  runId: 'custom-play-1-1000',
  customPlayId: 'custom-play-1',
  customPlayName: 'Morning Focus',
  meditationType: 'Ajapa',
  recordingLabel: 'Breath emphasis',
  mediaAssetId: 'media-ajapa-breath-15',
  mediaLabel: 'Ajapa Breath Cycle (15 min)',
  mediaFilePath: '/media/custom-plays/ajapa-breath-15.mp3',
  durationSeconds: 900,
  startedAt: '2026-03-23T10:00:00.000Z',
  startedAtMs: Date.parse('2026-03-23T10:00:00.000Z'),
  currentPositionSeconds: 420,
  isPaused: false,
  startSound: 'Temple Bell',
  endSound: 'Gong',
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

  it('keeps overrun completed duration for fixed sessions when completion is confirmed late', () => {
    const log = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:25:00.000Z'),
      completedDurationSeconds: 1500,
      status: 'completed',
    });

    expect(log.completedDurationSeconds).toBe(1500);
    expect(log.intendedDurationSeconds).toBe(1200);
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

  it('clamps non-finite completed duration values before persisting the auto log', () => {
    const log = buildAutoLogEntry({
      session: activeSession,
      endedAt: new Date('2026-03-23T10:01:00.000Z'),
      completedDurationSeconds: Number.NaN,
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

describe('buildCustomPlayLogEntry', () => {
  it('includes custom play metadata and caps completed duration to the media duration', () => {
    const log = buildCustomPlayLogEntry({
      customPlayRun: activeCustomPlayRun,
      endedAt: new Date('2026-03-23T10:15:00.000Z'),
      completedDurationSeconds: 1200,
      status: 'completed',
    });

    expect(log.customPlayId).toBe('custom-play-1');
    expect(log.customPlayName).toBe('Morning Focus');
    expect(log.customPlayRecordingLabel).toBe('Breath emphasis');
    expect(log.completedDurationSeconds).toBe(900);
    expect(log.intendedDurationSeconds).toBe(900);
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

describe('history meditation-type helpers', () => {
  it('allows only manual logs to change meditation type', () => {
    expect(canChangeSessionLogMeditationType({ source: 'manual log' })).toBe(true);
    expect(canChangeSessionLogMeditationType({ source: 'auto log' })).toBe(false);
  });

  it('updates only the meditation type field for a saved log copy', () => {
    const baseline = buildAutoLogEntry({
      session: {
        ...activeSession,
        meditationType: 'Vipassana',
      },
      endedAt: new Date('2026-03-23T10:20:00.000Z'),
      completedDurationSeconds: 1200,
      status: 'completed',
    });

    const updated = updateSessionLogMeditationType(
      {
        ...baseline,
        source: 'manual log',
      },
      'Kriya'
    );

    expect(updated.meditationType).toBe('Kriya');
    expect(updated.startedAt).toBe(baseline.startedAt);
    expect(updated.endedAt).toBe(baseline.endedAt);
    expect(updated.completedDurationSeconds).toBe(baseline.completedDurationSeconds);
    expect(updated.status).toBe(baseline.status);
  });
});
