import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { SyncQueueEntry, SyncQueueSummary } from '../../types/sync';

export interface SyncStatusContextValue {
  readonly isOnline: boolean;
  readonly queue: readonly SyncQueueEntry[];
  readonly summary: SyncQueueSummary;
  readonly replaceQueue: (queue: readonly SyncQueueEntry[]) => void;
  readonly updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void;
}

export interface SyncStatusProviderProps {
  readonly children: ReactNode;
}

export const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);
