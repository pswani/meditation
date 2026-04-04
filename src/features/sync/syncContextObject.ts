import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { SyncQueueEntry, SyncQueueSummary } from '../../types/sync';

export type BackendReachability = 'unknown' | 'reachable' | 'unreachable';
export type SyncConnectionMode = 'offline' | 'backend-unreachable' | 'online';

export interface SyncStatusContextValue {
  readonly isOnline: boolean;
  readonly backendReachability: BackendReachability;
  readonly connectionMode: SyncConnectionMode;
  readonly canAttemptBackendSync: boolean;
  readonly queue: readonly SyncQueueEntry[];
  readonly summary: SyncQueueSummary;
  readonly replaceQueue: (queue: readonly SyncQueueEntry[]) => void;
  readonly updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void;
  readonly reportBackendReachable: () => void;
  readonly reportBackendUnreachable: (error?: unknown) => void;
  readonly probeBackendReachability: (force?: boolean) => Promise<boolean>;
}

export interface SyncStatusProviderProps {
  readonly children: ReactNode;
}

export const SyncStatusContext = createContext<SyncStatusContextValue | null>(null);
