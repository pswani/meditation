import { useCallback, useEffect, useState } from 'react';
import type { SyncQueueEntry } from '../../types/sync';
import { loadSyncQueue, saveSyncQueue, summarizeSyncQueue, SYNC_QUEUE_STORAGE_KEY } from '../../utils/syncQueue';
import { SyncStatusContext, type SyncStatusProviderProps } from './syncContextObject';

function getInitialOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

export function SyncStatusProvider({ children }: SyncStatusProviderProps) {
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [queue, setQueue] = useState<readonly SyncQueueEntry[]>(() => loadSyncQueue());
  const summary = summarizeSyncQueue(queue);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
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
  }, []);

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

  return (
    <SyncStatusContext.Provider
      value={{
        isOnline,
        queue,
        summary,
        replaceQueue,
        updateQueue,
      }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}
