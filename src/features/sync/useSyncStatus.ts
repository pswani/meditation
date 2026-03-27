import { useContext } from 'react';
import { SyncStatusContext } from './syncContextObject';

export function useSyncStatus() {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatus must be used inside SyncStatusProvider');
  }

  return context;
}
