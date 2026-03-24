import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal } from '../types/sankalpa';
import { deriveSankalpaProgress, partitionSankalpaProgress, validateSankalpaDraft } from './sankalpa';

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
      targetValue: 0,
      days: 0,
      meditationType: '',
      timeOfDayBucket: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.goalType).toMatch(/required/i);
    expect(result.errors.targetValue).toMatch(/greater than 0/i);
    expect(result.errors.days).toMatch(/greater than 0/i);
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
    ];

    const logs = [
      createSessionLog({ endedAt: localIso(2026, 2, 21, 6, 0), completedDurationSeconds: 1200 }),
      createSessionLog({ endedAt: localIso(2026, 2, 21, 7, 0), completedDurationSeconds: 600 }),
    ];

    const progressList = [
      deriveSankalpaProgress(goals[0], logs, new Date(localIso(2026, 2, 21, 8, 0))),
      deriveSankalpaProgress(goals[1], logs, new Date(localIso(2026, 2, 21, 8, 0))),
      deriveSankalpaProgress(goals[2], logs, new Date(localIso(2026, 2, 25, 8, 0))),
    ];

    const partitioned = partitionSankalpaProgress(progressList);

    expect(partitioned.active).toHaveLength(1);
    expect(partitioned.completed).toHaveLength(1);
    expect(partitioned.expired).toHaveLength(1);
  });
});
