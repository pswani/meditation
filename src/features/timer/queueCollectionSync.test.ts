import { describe, expect, it } from 'vitest';
import type { SyncQueueEntry } from '../../types/sync';
import {
  areOrderedCollectionsEqual,
  buildQueueHydrationSignature,
  mergeEntriesById,
  reconcileQueueBackedCollection,
} from './queueCollectionSync';

interface TestEntry {
  readonly id: string;
  readonly label: string;
  readonly createdAt: string;
}

function createQueueEntry(overrides: Partial<SyncQueueEntry>): SyncQueueEntry {
  return {
    id: 'queue-1',
    entityType: 'custom-play',
    operation: 'upsert',
    recordId: 'entry-1',
    payload: { id: 'entry-1', label: 'Queued entry', createdAt: '2026-03-27T12:00:00.000Z' },
    queuedAt: '2026-03-27T12:00:00.000Z',
    state: 'pending',
    retryCount: 0,
    ...overrides,
  };
}

function mergeTestEntries(primary: readonly TestEntry[], secondary: readonly TestEntry[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

describe('queueCollectionSync helpers', () => {
  it('builds a compact queue hydration signature from queue metadata', () => {
    const pendingSignature = buildQueueHydrationSignature('online', [createQueueEntry({})]);
    const failedSignature = buildQueueHydrationSignature('online', [createQueueEntry({ state: 'failed', retryCount: 1 })]);

    expect(pendingSignature).not.toBe(failedSignature);
    expect(pendingSignature).toContain('online');
  });

  it('reconciles remote, retained local, and queued local collection state', () => {
    const remoteEntries: TestEntry[] = [
      { id: 'entry-2', label: 'Remote entry', createdAt: '2026-03-27T11:00:00.000Z' },
    ];
    const localEntries: TestEntry[] = [
      { id: 'entry-1', label: 'Local only entry', createdAt: '2026-03-27T12:00:00.000Z' },
      { id: 'entry-2', label: 'Remote entry', createdAt: '2026-03-27T11:00:00.000Z' },
    ];

    const result = reconcileQueueBackedCollection({
      remoteEntries,
      localEntries,
      queuedEntries: [createQueueEntry({ recordId: 'entry-3', payload: { id: 'entry-3', label: 'Queued entry', createdAt: '2026-03-27T13:00:00.000Z' } })],
      deletedRecordIds: new Set<string>(),
      syncedRecordIds: new Set<string>(['entry-1']),
      mergeEntries: mergeTestEntries,
    });

    expect(result.missingLocalEntries).toEqual([]);
    expect(result.nextEntries.map((entry) => entry.id)).toEqual(['entry-3', 'entry-1', 'entry-2']);
  });

  it('returns missing local entries that should be enqueued for replay', () => {
    const localOnlyEntry: TestEntry = {
      id: 'entry-1',
      label: 'Local only entry',
      createdAt: '2026-03-27T12:00:00.000Z',
    };

    const result = reconcileQueueBackedCollection({
      remoteEntries: [],
      localEntries: [localOnlyEntry],
      queuedEntries: [],
      deletedRecordIds: new Set<string>(),
      syncedRecordIds: new Set<string>(),
      mergeEntries: mergeTestEntries,
    });

    expect(result.missingLocalEntries).toEqual([localOnlyEntry]);
    expect(result.nextEntries).toEqual([localOnlyEntry]);
  });

  it('compares ordered collections with a domain-aware comparator', () => {
    const left: TestEntry[] = [{ id: 'entry-1', label: 'Same', createdAt: '2026-03-27T12:00:00.000Z' }];
    const right: TestEntry[] = [{ id: 'entry-1', label: 'Same', createdAt: '2026-03-27T12:00:00.000Z' }];

    expect(areOrderedCollectionsEqual(left, right, (current, next) => current.id === next.id && current.label === next.label)).toBe(
      true
    );
    expect(
      areOrderedCollectionsEqual(left, [{ ...right[0], label: 'Changed' }], (current, next) => current.id === next.id && current.label === next.label)
    ).toBe(false);
  });
});
