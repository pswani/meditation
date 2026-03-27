import { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionLog } from '../../types/sessionLog';
import type { SankalpaGoal, SankalpaProgress } from '../../types/sankalpa';
import { isApiClientError } from '../../utils/apiClient';
import { deriveSankalpaProgress } from '../../utils/sankalpa';
import { listSankalpaProgressFromApi, persistSankalpaToApi } from '../../utils/sankalpaApi';
import { loadSankalpas, saveSankalpas } from '../../utils/storage';

interface SankalpaSaveResult {
  readonly savedRemotely: boolean;
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

function formatSaveFallbackMessage(error: unknown): string {
  if (isApiClientError(error) && error.kind === 'network') {
    return 'Saved locally because the backend could not be reached.';
  }

  if (isApiClientError(error) && error.detail && error.detail.trim().length > 0) {
    return `Saved locally because the backend returned: ${error.detail.trim()}`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return `Saved locally because the backend returned: ${error.message.trim()}`;
  }

  return 'Saved locally because the backend is unavailable right now.';
}

export function useSankalpaProgress(sessionLogs: readonly SessionLog[]): UseSankalpaProgressResult {
  const [goals, setGoals] = useState<SankalpaGoal[]>(() => loadSankalpas());
  const [remoteProgressEntries, setRemoteProgressEntries] = useState<SankalpaProgress[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const goalsRef = useRef(goals);

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const localProgressEntries = useMemo(() => deriveLocalProgress(goals, sessionLogs), [goals, sessionLogs]);
  const progressEntries = remoteProgressEntries ?? localProgressEntries;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    listSankalpaProgressFromApi(undefined, controller.signal)
      .then(async (remoteProgressEntriesResponse) => {
        const cachedGoals = goalsRef.current;
        const remoteGoalIds = new Set(remoteProgressEntriesResponse.map((entry) => entry.goal.id));
        const missingCachedGoals = cachedGoals.filter((goal) => !remoteGoalIds.has(goal.id));
        let mergedProgressEntries = remoteProgressEntriesResponse;

        if (missingCachedGoals.length > 0) {
          const migratedProgressEntries = await Promise.all(
            missingCachedGoals.map((goal) => persistSankalpaToApi(goal))
          );
          mergedProgressEntries = mergeProgressEntries(remoteProgressEntriesResponse, migratedProgressEntries);
        } else {
          mergedProgressEntries = sortProgressEntries(remoteProgressEntriesResponse);
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
  }, [sessionLogs]);

  async function saveSankalpa(goal: SankalpaGoal): Promise<SankalpaSaveResult> {
    try {
      const savedProgressEntry = await persistSankalpaToApi(goal);
      const nextProgressEntries = mergeProgressEntries(progressEntries, [savedProgressEntry]);
      setRemoteProgressEntries(nextProgressEntries);
      setGoals(nextProgressEntries.map((entry) => entry.goal));
      syncLocalCache(nextProgressEntries);
      setSyncMessage(null);

      return {
        savedRemotely: true,
        message: 'Sankalpa saved.',
      };
    } catch (error) {
      const nextGoals = [...goalsRef.current.filter((entry) => entry.id !== goal.id), goal].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
      );
      setGoals(nextGoals);
      saveSankalpas(nextGoals);
      setRemoteProgressEntries(null);
      const message = formatSaveFallbackMessage(error);
      setSyncMessage(message);

      return {
        savedRemotely: false,
        message,
      };
    }
  }

  return {
    progressEntries,
    isLoading,
    syncMessage,
    saveSankalpa,
  };
}
