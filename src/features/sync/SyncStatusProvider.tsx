import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyncQueueEntry } from '../../types/sync';
import { requestJson } from '../../utils/apiClient';
import { loadSyncQueue, saveSyncQueue, summarizeSyncQueue, SYNC_QUEUE_STORAGE_KEY } from '../../utils/syncQueue';
import {
  SyncStatusContext,
  type BackendReachability,
  type SyncConnectionMode,
  type SyncStatusProviderProps,
} from './syncContextObject';

const BACKEND_REACHABILITY_POLL_MS = 15_000;
const BACKEND_REACHABILITY_PROBE_MIN_INTERVAL_MS = 5_000;

function getInitialOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [backendReachability, setBackendReachability] = useState<BackendReachability>('unknown');
  const [queue, setQueue] = useState<readonly SyncQueueEntry[]>(() => loadSyncQueue());
  const backendReachabilityRef = useRef(backendReachability);
  const probePromiseRef = useRef<Promise<boolean> | null>(null);
  const lastProbeAtRef = useRef(0);
  const summary = summarizeSyncQueue(queue);
  const connectionMode: SyncConnectionMode = !isOnline
    ? 'offline'
    : backendReachability === 'unreachable'
      ? 'backend-unreachable'
      : 'online';
  const canAttemptBackendSync = isOnline && backendReachability !== 'unreachable';

  useEffect(() => {
    backendReachabilityRef.current = backendReachability;
  }, [backendReachability]);

  const reportBackendReachable = useCallback(() => {
    setBackendReachability('reachable');
  }, []);

  const reportBackendUnreachable = useCallback((error?: unknown) => {
    if (!getInitialOnlineStatus()) {
      return;
    }

    if (typeof error === 'undefined') {
      setBackendReachability('unreachable');
      return;
    }

    setBackendReachability('unreachable');
  }, []);

  const probeBackendReachability = useCallback(async (force = false) => {
    if (!getInitialOnlineStatus()) {
      setBackendReachability('unknown');
      return false;
    }

    const now = Date.now();
    if (!force && probePromiseRef.current) {
      return probePromiseRef.current;
    }

    if (!force && now - lastProbeAtRef.current < BACKEND_REACHABILITY_PROBE_MIN_INTERVAL_MS) {
      return backendReachabilityRef.current === 'reachable';
    }

    const nextProbe = requestJson<unknown>('/health')
      .then(() => {
        lastProbeAtRef.current = Date.now();
        setBackendReachability('reachable');
        return true;
      })
      .catch(() => {
        lastProbeAtRef.current = Date.now();
        setBackendReachability('unreachable');
        return false;
      })
      .finally(() => {
        probePromiseRef.current = null;
      });

    probePromiseRef.current = nextProbe;
    return nextProbe;
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setBackendReachability('unknown');
      void probeBackendReachability(true);
    }

    function handleOffline() {
      setIsOnline(false);
      setBackendReachability('unknown');
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === SYNC_QUEUE_STORAGE_KEY) {
        setQueue(loadSyncQueue());
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
    };
  }, [probeBackendReachability]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    const shouldPoll =
      backendReachability === 'unreachable' || summary.nextRetryCount > 0 || summary.failedCount > 0;
    if (!shouldPoll) {
      return;
    }

    function handleFocus() {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void probeBackendReachability();
    }

    const intervalId = window.setInterval(() => {
      void probeBackendReachability();
    }, BACKEND_REACHABILITY_POLL_MS);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [backendReachability, isOnline, probeBackendReachability, summary.failedCount, summary.nextRetryCount]);

  const replaceQueue = useCallback((nextQueue: readonly SyncQueueEntry[]) => {
    const sortedQueue = [...nextQueue];
    saveSyncQueue(sortedQueue);
    setQueue(sortedQueue);
  }, []);

  const updateQueue = useCallback((updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => {
    setQueue((currentQueue) => {
      const nextQueue = [...updater(currentQueue)];
      saveSyncQueue(nextQueue);
      return nextQueue;
    });
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      backendReachability,
      connectionMode,
      canAttemptBackendSync,
      queue,
      summary,
      replaceQueue,
      updateQueue,
      reportBackendReachable,
      reportBackendUnreachable,
      probeBackendReachability,
    }),
    [
      backendReachability,
      canAttemptBackendSync,
      connectionMode,
      isOnline,
      probeBackendReachability,
      queue,
      replaceQueue,
      reportBackendReachable,
      reportBackendUnreachable,
      summary,
      updateQueue,
    ]
  );

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}
