import type { SyncEntityType, SyncOperation, SyncQueueEntry, SyncQueueSummary } from '../types/sync';

export const SYNC_QUEUE_STORAGE_KEY = 'meditation.syncQueue.v1';

interface CreateSyncQueueEntryInput {
  readonly entityType: SyncEntityType;
  readonly operation: SyncOperation;
  readonly recordId: string;
  readonly payload: unknown;
  readonly queuedAt?: string;
  readonly id?: string;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSyncEntityType(value: unknown): value is SyncEntityType {
  return (
    value === 'timer-settings' ||
    value === 'session-log' ||
    value === 'custom-play' ||
    value === 'playlist' ||
    value === 'sankalpa'
  );
}

function isSyncOperation(value: unknown): value is SyncOperation {
  return value === 'upsert' || value === 'delete';
}

function isSyncQueueEntryState(value: unknown): value is SyncQueueEntry['state'] {
  return value === 'pending' || value === 'in-flight' || value === 'failed';
}

function isSyncQueueEntry(value: unknown): value is SyncQueueEntry {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    isSyncEntityType(candidate.entityType) &&
    isSyncOperation(candidate.operation) &&
    typeof candidate.recordId === 'string' &&
    'payload' in candidate &&
    isValidIsoDate(candidate.queuedAt) &&
    isSyncQueueEntryState(candidate.state) &&
    typeof candidate.retryCount === 'number' &&
    Number.isInteger(candidate.retryCount) &&
    candidate.retryCount >= 0 &&
    (typeof candidate.lastAttemptAt === 'undefined' || isValidIsoDate(candidate.lastAttemptAt)) &&
    (typeof candidate.lastError === 'undefined' || typeof candidate.lastError === 'string')
  );
}

function createQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `sync-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

function sortSyncQueueEntries(queue: readonly SyncQueueEntry[]): SyncQueueEntry[] {
  return [...queue].sort((left, right) => Date.parse(left.queuedAt) - Date.parse(right.queuedAt));
}

function normalizeHydratedQueue(queue: readonly SyncQueueEntry[]): SyncQueueEntry[] {
  return sortSyncQueueEntries(
    queue.map((entry) =>
      entry.state === 'in-flight'
        ? {
            ...entry,
            state: 'pending',
          }
        : entry
    )
  );
}

export function createSyncQueueEntry(input: CreateSyncQueueEntryInput): SyncQueueEntry {
  return {
    id: input.id ?? createQueueId(),
    entityType: input.entityType,
    operation: input.operation,
    recordId: input.recordId,
    payload: input.payload,
    queuedAt: input.queuedAt ?? new Date().toISOString(),
    state: 'pending',
    retryCount: 0,
  };
}

export function loadSyncQueue(): SyncQueueEntry[] {
  const rawValue = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeHydratedQueue(parsed.filter(isSyncQueueEntry));
  } catch {
    return [];
  }
}

export function saveSyncQueue(queue: readonly SyncQueueEntry[]): void {
  localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(sortSyncQueueEntries(queue)));
}

export function buildSyncQueueRecordKey(entityType: SyncEntityType, recordId: string): string {
  return `${entityType}:${recordId}`;
}

export function enqueueSyncQueueEntry(
  queue: readonly SyncQueueEntry[],
  input: CreateSyncQueueEntryInput | SyncQueueEntry
): SyncQueueEntry[] {
  const nextEntry = 'state' in input ? input : createSyncQueueEntry(input);
  const nextRecordKey = buildSyncQueueRecordKey(nextEntry.entityType, nextEntry.recordId);
  const dedupedQueue = queue.filter(
    (entry) => buildSyncQueueRecordKey(entry.entityType, entry.recordId) !== nextRecordKey
  );

  return sortSyncQueueEntries([
    ...dedupedQueue,
    {
      ...nextEntry,
      state: 'pending',
      lastAttemptAt: undefined,
      lastError: undefined,
    },
  ]);
}

export function markSyncQueueEntryInFlight(queue: readonly SyncQueueEntry[], entryId: string, attemptedAt: string): SyncQueueEntry[] {
  return queue.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          state: 'in-flight',
          lastAttemptAt: attemptedAt,
          lastError: undefined,
        }
      : entry
  );
}

export function markSyncQueueEntryFailed(
  queue: readonly SyncQueueEntry[],
  entryId: string,
  attemptedAt: string,
  lastError: string
): SyncQueueEntry[] {
  return queue.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          state: 'failed',
          retryCount: entry.retryCount + 1,
          lastAttemptAt: attemptedAt,
          lastError,
        }
      : entry
  );
}

export function markSyncQueueEntryPending(queue: readonly SyncQueueEntry[], entryId: string): SyncQueueEntry[] {
  return queue.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          state: 'pending',
        }
      : entry
  );
}

export function removeSyncQueueEntry(queue: readonly SyncQueueEntry[], entryId: string): SyncQueueEntry[] {
  return queue.filter((entry) => entry.id !== entryId);
}

export function summarizeSyncQueue(queue: readonly SyncQueueEntry[]): SyncQueueSummary {
  let pendingCount = 0;
  let inFlightCount = 0;
  let failedCount = 0;

  for (const entry of queue) {
    if (entry.state === 'pending') {
      pendingCount += 1;
    } else if (entry.state === 'in-flight') {
      inFlightCount += 1;
    } else if (entry.state === 'failed') {
      failedCount += 1;
    }
  }

  return {
    totalCount: queue.length,
    pendingCount,
    inFlightCount,
    failedCount,
    nextRetryCount: pendingCount + failedCount,
    oldestQueuedAt: queue.length > 0 ? sortSyncQueueEntries(queue)[0]?.queuedAt ?? null : null,
  };
}
