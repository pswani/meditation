import { useEffect, useMemo, useRef, useState } from 'react';
import { useSyncStatus } from '../sync/useSyncStatus';
import type { SessionLog } from '../../types/sessionLog';
import type { SankalpaGoal, SankalpaProgress } from '../../types/sankalpa';
import { isApiClientError } from '../../utils/apiClient';
import { deriveSankalpaProgress } from '../../utils/sankalpa';
import { listSankalpaProgressFromApi, persistSankalpaToApi } from '../../utils/sankalpaApi';
import {
  enqueueSyncQueueEntry,
  markFailedSyncQueueEntriesPending,
  markSyncQueueEntryFailed,
  markSyncQueueEntryInFlight,
  removeSyncQueueEntry,
  selectSyncQueueEntries,
} from '../../utils/syncQueue';
import { loadSankalpas, saveSankalpas } from '../../utils/storage';
import { getUserTimeZone } from '../../utils/timeZone';

interface SankalpaSaveResult {
  readonly tone: 'ok' | 'warn' | 'error';
  readonly message: string;
}

interface UseSankalpaProgressResult {
  readonly progressEntries: SankalpaProgress[];
  readonly isLoading: boolean;
  readonly syncMessage: string | null;
  readonly saveSankalpa: (goal: SankalpaGoal) => Promise<SankalpaSaveResult>;
}

function sortProgressEntries(progressEntries: readonly SankalpaProgress[]): SankalpaProgress[] {
  return [...progressEntries].sort((left, right) => Date.parse(right.goal.createdAt) - Date.parse(left.goal.createdAt));
}

function mergeProgressEntries(
  primary: readonly SankalpaProgress[],
  secondary: readonly SankalpaProgress[]
): SankalpaProgress[] {
  const progressById = new Map<string, SankalpaProgress>();

  for (const entry of primary) {
    progressById.set(entry.goal.id, entry);
  }

  for (const entry of secondary) {
    progressById.set(entry.goal.id, entry);
  }

  return sortProgressEntries([...progressById.values()]);
}

function deriveLocalProgress(goals: readonly SankalpaGoal[], sessionLogs: readonly SessionLog[]): SankalpaProgress[] {
  const now = new Date();
  return sortProgressEntries(goals.map((goal) => deriveSankalpaProgress(goal, sessionLogs, now)));
}

function syncLocalCache(progressEntries: readonly SankalpaProgress[]): void {
  saveSankalpas(progressEntries.map((entry) => entry.goal));
}

function formatLoadMessage(error: unknown, hasLocalGoals: boolean): string {
  if (isApiClientError(error) && error.kind === 'network') {
    return hasLocalGoals
      ? 'Showing locally saved sankalpa goals because the backend could not be reached.'
      : 'Unable to load sankalpa goals from the backend right now.';
  }

  if (isApiClientError(error) && error.detail && error.detail.trim().length > 0) {
    return hasLocalGoals
      ? `Showing locally saved sankalpa goals because the backend returned: ${error.detail.trim()}`
      : `Unable to load sankalpa goals because the backend returned: ${error.detail.trim()}`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return hasLocalGoals
      ? `Showing locally saved sankalpa goals because the backend returned: ${error.message.trim()}`
      : `Unable to load sankalpa goals because the backend returned: ${error.message.trim()}`;
  }

  return hasLocalGoals
    ? 'Showing locally saved sankalpa goals because the backend is unavailable right now.'
    : 'Unable to load sankalpa goals from the backend right now.';
}

function formatSaveErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    if (error.detail && error.detail.trim().length > 0) {
      return error.detail.trim();
    }

    if (error.kind === 'network') {
      return 'Unable to save sankalpa right now.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return 'Unable to save sankalpa right now.';
}

export function useSankalpaProgress(sessionLogs: readonly SessionLog[]): UseSankalpaProgressResult {
  const { isOnline, queue, updateQueue } = useSyncStatus();
  const [goals, setGoals] = useState<SankalpaGoal[]>(() => loadSankalpas());
  const [remoteProgressEntries, setRemoteProgressEntries] = useState<SankalpaProgress[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const goalsRef = useRef(goals);
  const progressEntriesRef = useRef<SankalpaProgress[]>([]);
  const isFlushingQueueRef = useRef(false);
  const timeZone = useMemo(() => getUserTimeZone(), []);

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const localProgressEntries = useMemo(() => deriveLocalProgress(goals, sessionLogs), [goals, sessionLogs]);
  const progressEntries = remoteProgressEntries ?? localProgressEntries;

  useEffect(() => {
    progressEntriesRef.current = progressEntries;
  }, [progressEntries]);

  useEffect(() => {
    if (!isOnline) {
      setIsLoading(false);
      setRemoteProgressEntries(null);
      setSyncMessage(goalsRef.current.length > 0 ? 'Showing locally saved sankalpa goals while you are offline.' : null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    listSankalpaProgressFromApi({ signal: controller.signal, timeZone })
      .then(async (remoteProgressEntriesResponse) => {
        const cachedGoals = goalsRef.current;
        const queuedSankalpaEntries = selectSyncQueueEntries(queue, {
          entityTypes: ['sankalpa'],
        });
        const remoteGoalIds = new Set(remoteProgressEntriesResponse.map((entry) => entry.goal.id));
        const missingCachedGoals = cachedGoals.filter((goal) => !remoteGoalIds.has(goal.id));
        let mergedProgressEntries = remoteProgressEntriesResponse;

        if (missingCachedGoals.length > 0) {
          for (const goal of missingCachedGoals) {
            updateQueue((currentQueue) =>
              enqueueSyncQueueEntry(currentQueue, {
                entityType: 'sankalpa',
                operation: 'upsert',
                recordId: goal.id,
                payload: goal,
              })
            );
          }
          mergedProgressEntries = mergeProgressEntries(remoteProgressEntriesResponse, deriveLocalProgress(missingCachedGoals, sessionLogs));
        } else {
          mergedProgressEntries = sortProgressEntries(remoteProgressEntriesResponse);
        }

        for (const queueEntry of queuedSankalpaEntries) {
          if (queueEntry.operation !== 'upsert') {
            continue;
          }

          mergedProgressEntries = mergeProgressEntries(
            mergedProgressEntries,
            deriveLocalProgress([queueEntry.payload as SankalpaGoal], sessionLogs)
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setRemoteProgressEntries(mergedProgressEntries);
        setGoals(mergedProgressEntries.map((entry) => entry.goal));
        syncLocalCache(mergedProgressEntries);
        setSyncMessage(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteProgressEntries(null);
        setSyncMessage(formatLoadMessage(error, goalsRef.current.length > 0));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isOnline, queue, sessionLogs, timeZone, updateQueue]);

  async function saveSankalpa(goal: SankalpaGoal): Promise<SankalpaSaveResult> {
    const nextGoals = [...goalsRef.current.filter((entry) => entry.id !== goal.id), goal].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
    );
    setGoals(nextGoals);
    saveSankalpas(nextGoals);
    setRemoteProgressEntries(null);
    updateQueue((currentQueue) =>
      enqueueSyncQueueEntry(currentQueue, {
        entityType: 'sankalpa',
        operation: 'upsert',
        recordId: goal.id,
        payload: goal,
      })
    );

    if (isOnline) {
      setSyncMessage(null);
      return {
        tone: 'ok',
        message: 'Sankalpa saved.',
      };
    }

    const message = 'Saved locally because the backend could not be reached.';
    setSyncMessage(message);

    return {
      tone: 'warn',
      message,
    };
  }

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    updateQueue((currentQueue) => markFailedSyncQueueEntriesPending(currentQueue, ['sankalpa']));
  }, [isOnline, updateQueue]);

  useEffect(() => {
    if (!isOnline || isFlushingQueueRef.current) {
      return;
    }

    const pendingEntries = selectSyncQueueEntries(queue, {
      entityTypes: ['sankalpa'],
      states: ['pending'],
    });

    if (pendingEntries.length === 0) {
      return;
    }

    let cancelled = false;
    isFlushingQueueRef.current = true;

    async function flushQueuedSankalpas() {
      for (const queueEntry of pendingEntries) {
        if (cancelled || queueEntry.operation !== 'upsert') {
          continue;
        }

        const attemptedAt = new Date().toISOString();
        updateQueue((currentQueue) => markSyncQueueEntryInFlight(currentQueue, queueEntry.id, attemptedAt));

        try {
          const savedProgressEntry = await persistSankalpaToApi(queueEntry.payload as SankalpaGoal, { timeZone });
          if (cancelled) {
            return;
          }

          const nextProgressEntries = mergeProgressEntries(progressEntriesRef.current, [savedProgressEntry]);
          setRemoteProgressEntries(nextProgressEntries);
          setGoals(nextProgressEntries.map((entry) => entry.goal));
          syncLocalCache(nextProgressEntries);
          setSyncMessage(null);
          updateQueue((currentQueue) => removeSyncQueueEntry(currentQueue, queueEntry.id));
        } catch (error) {
          if (cancelled) {
            return;
          }

          const message = formatSaveErrorMessage(error);
          updateQueue((currentQueue) => markSyncQueueEntryFailed(currentQueue, queueEntry.id, attemptedAt, message));
          setSyncMessage(`${message} The locally saved sankalpa is still available in this browser.`);

          if (isApiClientError(error) && error.kind === 'network') {
            break;
          }
        }
      }
    }

    void flushQueuedSankalpas().finally(() => {
      isFlushingQueueRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [isOnline, queue, timeZone, updateQueue]);

  return {
    progressEntries,
    isLoading,
    syncMessage,
    saveSankalpa,
  };
}
