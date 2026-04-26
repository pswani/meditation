import type { EffectCallback, MutableRefObject } from 'react';
import type { SyncEntityType, SyncQueueEntry } from '../../types/sync';
import type { SyncConnectionMode } from '../sync/syncContextObject';
import { selectSyncQueueEntries } from '../../utils/syncQueue';
import { buildQueueHydrationSignature } from './queueCollectionSync';

export interface CollectionHydrationOptions {
  readonly entityTypes: readonly SyncEntityType[];
  readonly connectionMode: SyncConnectionMode;
  readonly canAttemptBackendSync: boolean;
  readonly latestSyncQueueRef: MutableRefObject<readonly SyncQueueEntry[]>;
  readonly completedKeyRef: MutableRefObject<string | null>;
  readonly inFlightKeyRef: MutableRefObject<string | null>;
  readonly setIsLoading: (value: boolean) => void;
  readonly onOffline: () => void;
  readonly onFetch: (queuedEntries: readonly SyncQueueEntry[], isCancelled: () => boolean) => Promise<void>;
  readonly onError: (error: unknown) => void;
  readonly onCompleted?: () => void;
}

/**
 * Builds a useEffect callback that handles the common dedup-key / cancel /
 * try-catch-finally skeleton shared by all four collection hydration effects.
 * Callers own the deps array and entity-specific callbacks.
 */
export function buildHydrationEffect(options: CollectionHydrationOptions): EffectCallback {
  return () => {
    let cancelled = false;
    const queuedEntries = selectSyncQueueEntries(options.latestSyncQueueRef.current, {
      entityTypes: options.entityTypes as SyncEntityType[],
    });
    const hydrationKey = buildQueueHydrationSignature(options.connectionMode, queuedEntries);

    if (
      options.completedKeyRef.current === hydrationKey ||
      options.inFlightKeyRef.current === hydrationKey
    ) {
      return;
    }

    options.inFlightKeyRef.current = hydrationKey;

    async function hydrate() {
      options.setIsLoading(true);

      if (!options.canAttemptBackendSync) {
        if (!cancelled) {
          options.onOffline();
          options.setIsLoading(false);
        }
        return;
      }

      try {
        await options.onFetch(queuedEntries, () => cancelled);
      } catch (error) {
        if (!cancelled) {
          options.onError(error);
        }
      } finally {
        if (!cancelled) {
          options.completedKeyRef.current = hydrationKey;
          options.onCompleted?.();
          options.setIsLoading(false);
        }
        if (options.inFlightKeyRef.current === hydrationKey) {
          options.inFlightKeyRef.current = null;
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
      if (options.inFlightKeyRef.current === hydrationKey) {
        options.inFlightKeyRef.current = null;
      }
    };
  };
}
