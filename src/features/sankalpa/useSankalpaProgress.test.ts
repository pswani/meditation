import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../../types/sessionLog';
import type { SankalpaGoal } from '../../types/sankalpa';
import type { SyncQueueEntry } from '../../types/sync';
import {
  applySankalpaReplayEntries,
  buildSankalpaReplayKey,
  findMissingSankalpaGoalsToQueue,
  selectSankalpaReplayEntries,
} from './useSankalpaProgress';

const sampleGoal: SankalpaGoal = {
  id: 'goal-1',
  goalType: 'duration-based',
  targetValue: 120,
  days: 7,
  meditationType: 'Vipassana',
  createdAt: '2026-03-26T12:00:00.000Z',
};

const sessionLogs: SessionLog[] = [
  {
    id: 'log-1',
    startedAt: '2026-03-26T12:00:00.000Z',
    endedAt: '2026-03-26T12:30:00.000Z',
    meditationType: 'Vipassana',
    intendedDurationSeconds: 1800,
    completedDurationSeconds: 1800,
    status: 'completed',
    source: 'auto log',
    startSound: 'None',
    endSound: 'Temple Bell',
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
  },
];

describe('useSankalpaProgress helpers', () => {
  it('does not re-queue cached goals that are already pending replay', () => {
    const cachedGoals: SankalpaGoal[] = [
      sampleGoal,
      {
        ...sampleGoal,
        id: 'goal-2',
        createdAt: '2026-03-27T12:00:00.000Z',
      },
    ];

    const missingGoals = findMissingSankalpaGoalsToQueue(
      cachedGoals,
      new Set(['goal-2']),
      [
        {
          operation: 'upsert',
          recordId: 'goal-1',
          payload: sampleGoal,
        },
      ]
    );

    expect(missingGoals).toEqual([]);
  });

  it('builds the same replay key when only queue state metadata changes', () => {
    const pendingQueue: SyncQueueEntry[] = [
      {
        id: 'queue-1',
        entityType: 'sankalpa',
        operation: 'upsert',
        recordId: sampleGoal.id,
        payload: sampleGoal,
        queuedAt: '2026-03-26T12:01:00.000Z',
        state: 'pending',
        retryCount: 0,
      },
    ];

    const failedQueue: SyncQueueEntry[] = [
      {
        ...pendingQueue[0],
        state: 'failed',
        retryCount: 2,
        lastAttemptAt: '2026-03-26T12:05:00.000Z',
        lastError: 'Network unavailable.',
      },
    ];

    expect(buildSankalpaReplayKey(selectSankalpaReplayEntries(pendingQueue))).toBe(
      buildSankalpaReplayKey(selectSankalpaReplayEntries(failedQueue))
    );
  });

  it('applies queued deletes after remote hydration so deleted archived goals stay gone', () => {
    const remoteEntries = [
      {
        goal: {
          ...sampleGoal,
          archived: true,
        },
        status: 'archived' as const,
        deadlineAt: '2026-04-02T12:00:00.000Z',
        matchedSessionCount: 0,
        matchedDurationSeconds: 0,
        targetSessionCount: 0,
        targetDurationSeconds: 7200,
        progressRatio: 0,
      },
    ];

    const replayEntries = [
      {
        operation: 'delete' as const,
        recordId: sampleGoal.id,
        payload: null,
      },
    ];

    expect(applySankalpaReplayEntries(remoteEntries, replayEntries, sessionLogs)).toEqual([]);
  });
});
