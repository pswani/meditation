import type { SyncQueueEntry } from '../../types/sync';

export function buildQueueHydrationSignature(isOnline: boolean, queueEntries: readonly SyncQueueEntry[]): string {
  return [
    isOnline ? 'online' : 'offline',
    ...queueEntries.map((entry) =>
      [
        entry.entityType,
        entry.recordId,
        entry.operation,
        entry.state,
        entry.queuedAt,
        entry.retryCount,
        entry.lastAttemptAt ?? '',
      ].join(':')
    ),
  ].join('|');
}

export function areOrderedCollectionsEqual<T>(
  left: readonly T[],
  right: readonly T[],
  isEqual: (leftEntry: T, rightEntry: T) => boolean
): boolean {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => isEqual(entry, right[index]!));
}

export function mergeEntriesById<T extends { readonly id: string }>(
  primary: readonly T[],
  secondary: readonly T[],
  compare: (left: T, right: T) => number
): T[] {
  const entriesById = new Map<string, T>();

  for (const entry of primary) {
    entriesById.set(entry.id, entry);
  }

  for (const entry of secondary) {
    if (!entriesById.has(entry.id)) {
      entriesById.set(entry.id, entry);
    }
  }

  return [...entriesById.values()].sort(compare);
}

export function applyQueuedCollectionMutations<T extends { readonly id: string }>(
  entries: readonly T[],
  queueEntries: readonly SyncQueueEntry[]
): T[] {
  let nextEntries = [...entries];

  for (const queueEntry of queueEntries) {
    if (queueEntry.operation === 'delete') {
      nextEntries = nextEntries.filter((entry) => entry.id !== queueEntry.recordId);
      continue;
    }

    const payload = queueEntry.payload as T;
    const existingIndex = nextEntries.findIndex((entry) => entry.id === payload.id);

    if (existingIndex >= 0) {
      nextEntries[existingIndex] = payload;
    } else {
      nextEntries = [payload, ...nextEntries];
    }
  }

  return nextEntries;
}

interface ReconcileQueueBackedCollectionOptions<T extends { readonly id: string }> {
  readonly remoteEntries: readonly T[];
  readonly localEntries: readonly T[];
  readonly queuedEntries: readonly SyncQueueEntry[];
  readonly deletedRecordIds: ReadonlySet<string>;
  readonly syncedRecordIds: ReadonlySet<string>;
  readonly mergeEntries: (primary: readonly T[], secondary: readonly T[]) => T[];
}

interface ReconcileQueueBackedCollectionResult<T extends { readonly id: string }> {
  readonly filteredRemoteEntries: T[];
  readonly missingLocalEntries: T[];
  readonly nextEntries: T[];
}

export function reconcileQueueBackedCollection<T extends { readonly id: string }>(
  options: ReconcileQueueBackedCollectionOptions<T>
): ReconcileQueueBackedCollectionResult<T> {
  const filteredRemoteEntries = options.remoteEntries.filter((entry) => !options.deletedRecordIds.has(entry.id));
  const queuedRecordIds = new Set(options.queuedEntries.map((entry) => entry.recordId));

  const localOnlyEntries = options.localEntries.filter(
    (entry) => !filteredRemoteEntries.some((remoteEntry) => remoteEntry.id === entry.id) && !queuedRecordIds.has(entry.id)
  );
  const retainedLocalEntries = localOnlyEntries.filter((entry) => options.syncedRecordIds.has(entry.id));
  const missingLocalEntries = localOnlyEntries.filter((entry) => !options.syncedRecordIds.has(entry.id));

  const mergedEntries = options.mergeEntries(filteredRemoteEntries, retainedLocalEntries);
  const nextEntries = applyQueuedCollectionMutations(
    options.mergeEntries(mergedEntries, missingLocalEntries),
    options.queuedEntries
  );

  return {
    filteredRemoteEntries,
    missingLocalEntries,
    nextEntries,
  };
}
