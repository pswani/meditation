import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal } from '../types/sankalpa';
import {
  createSankalpaGoal,
  deriveSankalpaProgress,
  getTimeOfDayBucket,
  partitionSankalpaProgress,
  setSankalpaObservanceStatus,
  unarchiveSankalpaGoal,
  validateSankalpaDraft,
} from './sankalpa';

function localIso(year: number, monthIndex: number, day: number, hour: number, minute = 0): string {
  return new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();
}

function createSessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: overrides.id ?? 'log',
    startedAt: overrides.startedAt ?? localIso(2026, 2, 21, 6, 0),
    endedAt: overrides.endedAt ?? localIso(2026, 2, 21, 6, 20),
    meditationType: overrides.meditationType ?? 'Vipassana',
    intendedDurationSeconds: overrides.intendedDurationSeconds ?? 1200,
    completedDurationSeconds: overrides.completedDurationSeconds ?? 1200,
    status: overrides.status ?? 'completed',
    source: overrides.source ?? 'auto log',
    startSound: overrides.startSound ?? 'None',
    endSound: overrides.endSound ?? 'None',
    intervalEnabled: overrides.intervalEnabled ?? false,
    intervalMinutes: overrides.intervalMinutes ?? 0,
    intervalSound: overrides.intervalSound ?? 'None',
    playlistId: overrides.playlistId,
    playlistName: overrides.playlistName,
    playlistItemPosition: overrides.playlistItemPosition,
    playlistItemCount: overrides.playlistItemCount,
    playlistRunId: overrides.playlistRunId,
    playlistRunStartedAt: overrides.playlistRunStartedAt,
  };
}

describe('sankalpa helpers', () => {
  it('validates positive target and days', () => {
    const result = validateSankalpaDraft({
      goalType: '',
      cadenceMode: 'cumulative',
      targetValue: 0,
      days: 0,
      weeks: 1,
      qualifyingDaysPerWeek: 5,
      meditationType: '',
      timeOfDayBucket: '',
      observanceLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.goalType).toMatch(/required/i);
    expect(result.errors.targetValue).toMatch(/greater than 0/i);
    expect(result.errors.days).toMatch(/greater than 0/i);
  });

  it('requires whole-number session-count targets and whole-number days', () => {
    const result = validateSankalpaDraft({
      goalType: 'session-count-based',
      cadenceMode: 'cumulative',
      targetValue: 2.5,
      days: 7.5,
      weeks: 1,
      qualifyingDaysPerWeek: 5,
      meditationType: '',
      timeOfDayBucket: '',
      observanceLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.targetValue).toMatch(/whole number/i);
    expect(result.errors.days).toMatch(/whole number/i);
  });

  it('requires an observance label for observance-based sankalpas', () => {
    const result = validateSankalpaDraft({
      goalType: 'observance-based',
      cadenceMode: 'cumulative',
      targetValue: 7,
      days: 7,
      weeks: 1,
      qualifyingDaysPerWeek: 5,
      meditationType: '',
      timeOfDayBucket: '',
      observanceLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.observanceLabel).toMatch(/required/i);
  });

  it('creates observance-based sankalpas with a target equal to the scheduled days', () => {
    const goal = createSankalpaGoal(
      {
        goalType: 'observance-based',
        cadenceMode: 'cumulative',
        targetValue: 99,
        days: 5,
        weeks: 1,
        qualifyingDaysPerWeek: 5,
        meditationType: '',
        timeOfDayBucket: '',
        observanceLabel: 'Brahmacharya',
      },
      new Date(localIso(2026, 3, 5, 8, 0))
    );

    expect(goal.goalType).toBe('observance-based');
    expect(goal.targetValue).toBe(5);
    expect(goal.observanceLabel).toBe('Brahmacharya');
    expect(goal.observanceRecords).toEqual([]);
  });

  it('derives recurring weekly cadence progress from qualifying days', () => {
    const goal: SankalpaGoal = {
      id: 'goal-recurring-duration',
      goalType: 'duration-based',
      targetValue: 15,
      days: 14,
      qualifyingDaysPerWeek: 5,
      meditationType: 'Tratak',
      createdAt: localIso(2026, 2, 16, 8, 0),
    };

    const logs = [
      createSessionLog({ id: 'w1d1', meditationType: 'Tratak', endedAt: localIso(2026, 2, 16, 8, 30), completedDurationSeconds: 900 }),
      createSessionLog({ id: 'w1d2', meditationType: 'Tratak', endedAt: localIso(2026, 2, 17, 8, 30), completedDurationSeconds: 1200 }),
      createSessionLog({ id: 'w1d3', meditationType: 'Tratak', endedAt: localIso(2026, 2, 18, 8, 30), completedDurationSeconds: 960 }),
      createSessionLog({ id: 'w1d4', meditationType: 'Tratak', endedAt: localIso(2026, 2, 19, 8, 30), completedDurationSeconds: 1200 }),
      createSessionLog({ id: 'w1d5', meditationType: 'Tratak', endedAt: localIso(2026, 2, 20, 8, 30), completedDurationSeconds: 960 }),
      createSessionLog({ id: 'w2d1', meditationType: 'Tratak', endedAt: localIso(2026, 2, 23, 8, 30), completedDurationSeconds: 900 }),
      createSessionLog({ id: 'w2d2', meditationType: 'Tratak', endedAt: localIso(2026, 2, 24, 8, 30), completedDurationSeconds: 900 }),
      createSessionLog({ id: 'w2d3', meditationType: 'Tratak', endedAt: localIso(2026, 2, 25, 8, 30), completedDurationSeconds: 600 }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 25, 12, 0)));

    expect(progress.metRecurringWeekCount).toBe(1);
    expect(progress.targetRecurringWeekCount).toBe(2);
    expect(progress.recurringWeeks).toEqual([
      expect.objectContaining({ weekIndex: 1, qualifyingDayCount: 5, requiredQualifyingDayCount: 5, status: 'met' }),
      expect.objectContaining({ weekIndex: 2, qualifyingDayCount: 2, requiredQualifyingDayCount: 5, status: 'active' }),
    ]);
    expect(progress.progressRatio).toBe(0.5);
    expect(progress.status).toBe('active');
  });

  it('counts matching session logs for session-count-based sankalpa with optional filters', () => {
    const goal: SankalpaGoal = {
      id: 'goal-1',
      goalType: 'session-count-based',
      targetValue: 2,
      days: 7,
      meditationType: 'Vipassana',
      timeOfDayBucket: 'morning',
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const logs = [
      createSessionLog({
        id: 'log-1',
        endedAt: localIso(2026, 2, 21, 6, 30),
        meditationType: 'Vipassana',
        source: 'auto log',
      }),
      createSessionLog({
        id: 'log-2',
        endedAt: localIso(2026, 2, 21, 18, 30),
        meditationType: 'Vipassana',
        source: 'manual log',
      }),
      createSessionLog({
        id: 'log-3',
        endedAt: localIso(2026, 2, 22, 6, 45),
        meditationType: 'Ajapa',
        source: 'manual log',
      }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 24, 9, 0)));

    expect(progress.matchedSessionCount).toBe(1);
    expect(progress.targetSessionCount).toBe(2);
    expect(progress.progressRatio).toBe(0.5);
    expect(progress.status).toBe('active');
  });

  it('counts proportional duration for duration-based sankalpa and supports completion', () => {
    const goal: SankalpaGoal = {
      id: 'goal-2',
      goalType: 'duration-based',
      targetValue: 30,
      days: 5,
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const logs = [
      createSessionLog({
        id: 'log-1',
        endedAt: localIso(2026, 2, 21, 7, 0),
        completedDurationSeconds: 1200,
        source: 'auto log',
      }),
      createSessionLog({
        id: 'log-2',
        endedAt: localIso(2026, 2, 22, 8, 0),
        completedDurationSeconds: 600,
        status: 'ended early',
        source: 'manual log',
      }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 22, 10, 0)));

    expect(progress.matchedDurationSeconds).toBe(1800);
    expect(progress.targetDurationSeconds).toBe(1800);
    expect(progress.progressRatio).toBe(1);
    expect(progress.status).toBe('completed');
  });

  it('counts both auto and manual logs when no source filter is applied', () => {
    const goal: SankalpaGoal = {
      id: 'goal-source-default',
      goalType: 'session-count-based',
      targetValue: 3,
      days: 7,
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const logs = [
      createSessionLog({
        id: 'auto-1',
        endedAt: localIso(2026, 2, 21, 7, 0),
        source: 'auto log',
      }),
      createSessionLog({
        id: 'manual-1',
        endedAt: localIso(2026, 2, 21, 8, 0),
        source: 'manual log',
      }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 22, 9, 0)));
    expect(progress.matchedSessionCount).toBe(2);
    expect(progress.status).toBe('active');
  });

  it('counts only logs within the sankalpa window, inclusive of exact deadline', () => {
    const goal: SankalpaGoal = {
      id: 'goal-window',
      goalType: 'session-count-based',
      targetValue: 2,
      days: 2,
      createdAt: localIso(2026, 2, 20, 8, 0),
    };

    const logs = [
      createSessionLog({ id: 'before-created', endedAt: localIso(2026, 2, 20, 7, 59) }),
      createSessionLog({ id: 'within-window', endedAt: localIso(2026, 2, 20, 9, 0) }),
      createSessionLog({ id: 'at-deadline', endedAt: localIso(2026, 2, 22, 8, 0) }),
      createSessionLog({ id: 'after-deadline', endedAt: localIso(2026, 2, 22, 8, 1) }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 21, 10, 0)));
    expect(progress.matchedSessionCount).toBe(2);
    expect(progress.status).toBe('completed');
  });

  it('applies time-of-day bucket boundaries when matching filtered logs', () => {
    const goal: SankalpaGoal = {
      id: 'goal-morning-boundary',
      goalType: 'session-count-based',
      targetValue: 2,
      days: 2,
      timeOfDayBucket: 'morning',
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const logs = [
      createSessionLog({ id: 'night-459', endedAt: localIso(2026, 2, 20, 4, 59) }),
      createSessionLog({ id: 'morning-500', endedAt: localIso(2026, 2, 20, 5, 0) }),
      createSessionLog({ id: 'morning-1159', endedAt: localIso(2026, 2, 20, 11, 59) }),
      createSessionLog({ id: 'afternoon-1200', endedAt: localIso(2026, 2, 20, 12, 0) }),
    ];

    const progress = deriveSankalpaProgress(goal, logs, new Date(localIso(2026, 2, 20, 13, 0)));
    expect(progress.matchedSessionCount).toBe(2);
    expect(progress.status).toBe('completed');
  });

  it('marks goals as expired when deadline passes without target completion', () => {
    const goal: SankalpaGoal = {
      id: 'goal-3',
      goalType: 'session-count-based',
      targetValue: 3,
      days: 1,
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const progress = deriveSankalpaProgress(
      goal,
      [createSessionLog({ endedAt: localIso(2026, 2, 20, 7, 0) })],
      new Date(localIso(2026, 2, 25, 7, 0))
    );

    expect(progress.matchedSessionCount).toBe(1);
    expect(progress.status).toBe('expired');
  });

  it('keeps completed status after deadline when target was reached', () => {
    const goal: SankalpaGoal = {
      id: 'goal-completed-before-deadline',
      goalType: 'session-count-based',
      targetValue: 1,
      days: 1,
      createdAt: localIso(2026, 2, 20, 0, 0),
    };

    const progress = deriveSankalpaProgress(
      goal,
      [createSessionLog({ id: 'matching-log', endedAt: localIso(2026, 2, 20, 7, 0) })],
      new Date(localIso(2026, 2, 25, 7, 0))
    );

    expect(progress.matchedSessionCount).toBe(1);
    expect(progress.status).toBe('completed');
  });

  it('marks archived goals as archived while preserving derived progress details', () => {
    const goal: SankalpaGoal = {
      id: 'goal-archived',
      goalType: 'session-count-based',
      targetValue: 3,
      days: 7,
      createdAt: localIso(2026, 2, 20, 0, 0),
      archived: true,
    };

    const progress = deriveSankalpaProgress(
      goal,
      [
        createSessionLog({ id: 'matching-log-1', endedAt: localIso(2026, 2, 21, 7, 0) }),
        createSessionLog({ id: 'matching-log-2', endedAt: localIso(2026, 2, 21, 8, 0) }),
      ],
      new Date(localIso(2026, 2, 22, 7, 0))
    );

    expect(progress.matchedSessionCount).toBe(2);
    expect(progress.status).toBe('archived');
  });

  it('derives observance progress from manual per-date records', () => {
    const goal: SankalpaGoal = {
      id: 'goal-observance',
      goalType: 'observance-based',
      targetValue: 3,
      days: 3,
      observanceLabel: 'Meal before 7 PM',
      observanceRecords: [
        { date: '2026-04-05', status: 'observed' },
        { date: '2026-04-06', status: 'missed' },
      ],
      createdAt: localIso(2026, 3, 5, 8, 0),
    };

    const progress = deriveSankalpaProgress(goal, [], new Date(localIso(2026, 3, 7, 10, 0)));

    expect(progress.matchedObservanceCount).toBe(1);
    expect(progress.missedObservanceCount).toBe(1);
    expect(progress.pendingObservanceCount).toBe(1);
    expect(progress.targetObservanceCount).toBe(3);
    expect(progress.observanceDays).toEqual([
      { date: '2026-04-05', status: 'observed', isFuture: false },
      { date: '2026-04-06', status: 'missed', isFuture: false },
      { date: '2026-04-07', status: 'pending', isFuture: false },
    ]);
  });

  it('updates and clears observance records through the helper', () => {
    const goal: SankalpaGoal = {
      id: 'goal-observance-helper',
      goalType: 'observance-based',
      targetValue: 2,
      days: 2,
      observanceLabel: 'Brahmacharya',
      observanceRecords: [{ date: '2026-04-05', status: 'missed' }],
      createdAt: localIso(2026, 3, 5, 8, 0),
    };

    const markedObserved = setSankalpaObservanceStatus(goal, '2026-04-05', 'observed');
    expect(markedObserved.observanceRecords).toEqual([{ date: '2026-04-05', status: 'observed' }]);

    const cleared = setSankalpaObservanceStatus(markedObserved, '2026-04-05', 'pending');
    expect(cleared.observanceRecords).toEqual([]);
  });

  it('restores archived goals into their derived non-archived status when unarchived', () => {
    const goal: SankalpaGoal = {
      id: 'goal-restored',
      goalType: 'session-count-based',
      targetValue: 2,
      days: 3,
      createdAt: localIso(2026, 2, 20, 0, 0),
      archived: true,
    };

    const restoredGoal = unarchiveSankalpaGoal(goal);
    const progress = deriveSankalpaProgress(
      restoredGoal,
      [createSessionLog({ endedAt: localIso(2026, 2, 21, 7, 0) })],
      new Date(localIso(2026, 2, 22, 7, 0))
    );

    expect(restoredGoal.archived).toBe(false);
    expect(progress.status).toBe('active');
  });

  it('maps time-of-day buckets at key clock boundaries', () => {
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 4, 59, 0, 0))).toBe('night');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 5, 0, 0, 0))).toBe('morning');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 11, 59, 0, 0))).toBe('morning');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 12, 0, 0, 0))).toBe('afternoon');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 16, 59, 0, 0))).toBe('afternoon');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 17, 0, 0, 0))).toBe('evening');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 20, 59, 0, 0))).toBe('evening');
    expect(getTimeOfDayBucket(new Date(2026, 2, 20, 21, 0, 0, 0))).toBe('night');
  });

  it('partitions sankalpa progress entries by status', () => {
    const goals: SankalpaGoal[] = [
      {
        id: 'active',
        goalType: 'session-count-based',
        targetValue: 3,
        days: 3,
        createdAt: localIso(2026, 2, 20, 0, 0),
      },
      {
        id: 'completed',
        goalType: 'duration-based',
        targetValue: 20,
        days: 3,
        createdAt: localIso(2026, 2, 20, 0, 0),
      },
      {
        id: 'expired',
        goalType: 'session-count-based',
        targetValue: 5,
        days: 1,
        createdAt: localIso(2026, 2, 20, 0, 0),
      },
      {
        id: 'archived',
        goalType: 'session-count-based',
        targetValue: 2,
        days: 3,
        createdAt: localIso(2026, 2, 20, 0, 0),
        archived: true,
      },
    ];

    const logs = [
      createSessionLog({ endedAt: localIso(2026, 2, 21, 6, 0), completedDurationSeconds: 1200 }),
      createSessionLog({ endedAt: localIso(2026, 2, 21, 7, 0), completedDurationSeconds: 600 }),
    ];

    const progressList = [
      deriveSankalpaProgress(goals[0], logs, new Date(localIso(2026, 2, 21, 8, 0))),
      deriveSankalpaProgress(goals[1], logs, new Date(localIso(2026, 2, 21, 8, 0))),
      deriveSankalpaProgress(goals[2], logs, new Date(localIso(2026, 2, 25, 8, 0))),
      deriveSankalpaProgress(goals[3], logs, new Date(localIso(2026, 2, 21, 8, 0))),
    ];

    const partitioned = partitionSankalpaProgress(progressList);

    expect(partitioned.active).toHaveLength(1);
    expect(partitioned.completed).toHaveLength(1);
    expect(partitioned.expired).toHaveLength(1);
    expect(partitioned.archived).toHaveLength(1);
  });
});
