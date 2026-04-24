import type { SyncEntityType, SyncOperation, SyncQueueEntry, SyncQueueSummary } from '../types/sync';

export const SYNC_QUEUE_STORAGE_KEY = 'meditation.syncQueue.v1';

/**
 * In-flight entries older than this threshold are demoted to pending on queue load.
 * Prevents a mid-flush reload or multi-tab race from stranding entries in-flight forever.
 * Entries with a recent lastAttemptAt stay in-flight to allow a legitimate concurrent sync to complete.
 */
export const STALLED_INFLIGHT_THRESHOLD_MS = 30_000;

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

function normalizeHydratedQueue(
  queue: readonly SyncQueueEntry[],
  nowMs: number = Date.now()
): SyncQueueEntry[] {
  return sortSyncQueueEntries(
    queue.map((entry) => {
      if (entry.state !== 'in-flight') {
        return entry;
      }
      const lastAttemptMs = entry.lastAttemptAt ? Date.parse(entry.lastAttemptAt) : null;
      const isStalled =
        lastAttemptMs === null || nowMs - lastAttemptMs > STALLED_INFLIGHT_THRESHOLD_MS;
      return isStalled ? { ...entry, state: 'pending' } : entry;
    })
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

/**
 * Enqueues a sync entry with operation-aware deduplication:
 * - DELETE supersedes all pending entries for the same record (both upserts and prior deletes).
 * - UPSERT deduplicates against other upserts but preserves any pending delete, so an
 *   accidental background upsert cannot silently undo a user-initiated delete.
 */
export function enqueueSyncQueueEntry(
  queue: readonly SyncQueueEntry[],
  input: CreateSyncQueueEntryInput | SyncQueueEntry
): SyncQueueEntry[] {
  const nextEntry = 'state' in input ? input : createSyncQueueEntry(input);
  const nextRecordKey = buildSyncQueueRecordKey(nextEntry.entityType, nextEntry.recordId);

  let dedupedQueue: SyncQueueEntry[];
  if (nextEntry.operation === 'delete') {
    // A delete supersedes any pending upserts or prior deletes for this record.
    dedupedQueue = queue.filter(
      (entry) => buildSyncQueueRecordKey(entry.entityType, entry.recordId) !== nextRecordKey
    );
  } else {
    // An upsert deduplicates against other upserts but preserves a pending delete.
    dedupedQueue = queue.filter(
      (entry) =>
        buildSyncQueueRecordKey(entry.entityType, entry.recordId) !== nextRecordKey ||
        entry.operation === 'delete'
    );
  }

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

export function markFailedSyncQueueEntriesPending(
  queue: readonly SyncQueueEntry[],
  entityTypes?: readonly SyncEntityType[]
): SyncQueueEntry[] {
  const allowedTypes = entityTypes ? new Set(entityTypes) : null;

  return queue.map((entry) => {
    if (entry.state !== 'failed') {
      return entry;
    }

    if (allowedTypes && !allowedTypes.has(entry.entityType)) {
      return entry;
    }

    return {
      ...entry,
      state: 'pending',
    };
  });
}

export function removeSyncQueueEntry(queue: readonly SyncQueueEntry[], entryId: string): SyncQueueEntry[] {
  return queue.filter((entry) => entry.id !== entryId);
}

export function selectSyncQueueEntries(
  queue: readonly SyncQueueEntry[],
  options?: {
    readonly entityTypes?: readonly SyncEntityType[];
    readonly states?: readonly SyncQueueEntry['state'][];
  }
): SyncQueueEntry[] {
  const allowedTypes = options?.entityTypes ? new Set(options.entityTypes) : null;
  const allowedStates = options?.states ? new Set(options.states) : null;

  return sortSyncQueueEntries(
    queue.filter((entry) => {
      if (allowedTypes && !allowedTypes.has(entry.entityType)) {
        return false;
      }

      if (allowedStates && !allowedStates.has(entry.state)) {
        return false;
      }

      return true;
    })
  );
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
