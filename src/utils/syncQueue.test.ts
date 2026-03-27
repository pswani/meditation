import { beforeEach, describe, expect, it } from 'vitest';
import type { SyncQueueEntry } from '../types/sync';
import {
  createSyncQueueEntry,
  enqueueSyncQueueEntry,
  loadSyncQueue,
  markSyncQueueEntryFailed,
  markSyncQueueEntryInFlight,
  removeSyncQueueEntry,
  saveSyncQueue,
  summarizeSyncQueue,
  SYNC_QUEUE_STORAGE_KEY,
} from './syncQueue';

describe('sync queue storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads queue entries', () => {
    const queue = [
      createSyncQueueEntry({
        id: 'sync-1',
        entityType: 'session-log',
        operation: 'upsert',
        recordId: 'log-1',
        payload: { id: 'log-1' },
        queuedAt: '2026-03-27T10:00:00.000Z',
      }),
    ];

    saveSyncQueue(queue);

    expect(loadSyncQueue()).toEqual(queue);
  });

  it('drops malformed stored queue values', () => {
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify([{ id: 'broken' }]));

    expect(loadSyncQueue()).toEqual([]);
  });

  it('requeues in-flight work as pending on reload', () => {
    const queue: SyncQueueEntry[] = [
      {
        ...createSyncQueueEntry({
          id: 'sync-1',
          entityType: 'playlist',
          operation: 'upsert',
          recordId: 'playlist-1',
          payload: { id: 'playlist-1' },
          queuedAt: '2026-03-27T10:00:00.000Z',
        }),
        state: 'in-flight',
        lastAttemptAt: '2026-03-27T10:01:00.000Z',
      },
    ];

    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));

    expect(loadSyncQueue()).toEqual([
      {
        ...queue[0],
        state: 'pending',
      },
    ]);
  });
});

describe('sync queue operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('replaces older queued work for the same entity record', () => {
    const initialQueue = [
      createSyncQueueEntry({
        id: 'sync-1',
        entityType: 'custom-play',
        operation: 'upsert',
        recordId: 'play-1',
        payload: { name: 'Morning Sit' },
        queuedAt: '2026-03-27T10:00:00.000Z',
      }),
    ];

    const nextQueue = enqueueSyncQueueEntry(initialQueue, {
      id: 'sync-2',
      entityType: 'custom-play',
      operation: 'delete',
      recordId: 'play-1',
      payload: null,
      queuedAt: '2026-03-27T10:05:00.000Z',
    });

    expect(nextQueue).toEqual([
      {
        id: 'sync-2',
        entityType: 'custom-play',
        operation: 'delete',
        recordId: 'play-1',
        payload: null,
        queuedAt: '2026-03-27T10:05:00.000Z',
        state: 'pending',
        retryCount: 0,
      },
    ]);
  });

  it('tracks in-flight and failed retry state', () => {
    const initialQueue = [
      createSyncQueueEntry({
        id: 'sync-1',
        entityType: 'sankalpa',
        operation: 'upsert',
        recordId: 'goal-1',
        payload: { id: 'goal-1' },
        queuedAt: '2026-03-27T10:00:00.000Z',
      }),
    ];

    const inFlightQueue = markSyncQueueEntryInFlight(initialQueue, 'sync-1', '2026-03-27T10:01:00.000Z');
    const failedQueue = markSyncQueueEntryFailed(
      inFlightQueue,
      'sync-1',
      '2026-03-27T10:01:05.000Z',
      'backend unavailable'
    );

    expect(failedQueue).toEqual([
      {
        ...initialQueue[0],
        state: 'failed',
        retryCount: 1,
        lastAttemptAt: '2026-03-27T10:01:05.000Z',
        lastError: 'backend unavailable',
      },
    ]);
  });

  it('summarizes pending retry work and removes completed items', () => {
    const queue = [
      createSyncQueueEntry({
        id: 'sync-1',
        entityType: 'timer-settings',
        operation: 'upsert',
        recordId: 'default',
        payload: { durationMinutes: 20 },
        queuedAt: '2026-03-27T10:00:00.000Z',
      }),
      {
        ...createSyncQueueEntry({
          id: 'sync-2',
          entityType: 'session-log',
          operation: 'upsert',
          recordId: 'log-2',
          payload: { id: 'log-2' },
          queuedAt: '2026-03-27T10:02:00.000Z',
        }),
        state: 'failed' as const,
        retryCount: 2,
        lastAttemptAt: '2026-03-27T10:03:00.000Z',
        lastError: 'timeout',
      },
    ];

    expect(summarizeSyncQueue(queue)).toEqual({
      totalCount: 2,
      pendingCount: 1,
      inFlightCount: 0,
      failedCount: 1,
      nextRetryCount: 2,
      oldestQueuedAt: '2026-03-27T10:00:00.000Z',
    });

    expect(removeSyncQueueEntry(queue, 'sync-1')).toEqual([queue[1]]);
  });
});
