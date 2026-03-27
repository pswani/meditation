export type SyncEntityType = 'timer-settings' | 'session-log' | 'custom-play' | 'playlist' | 'sankalpa';
export type SyncOperation = 'upsert' | 'delete';
export type SyncQueueEntryState = 'pending' | 'in-flight' | 'failed';

export interface SyncQueueEntry {
  readonly id: string;
  readonly entityType: SyncEntityType;
  readonly operation: SyncOperation;
  readonly recordId: string;
  readonly payload: unknown;
  readonly queuedAt: string;
  readonly state: SyncQueueEntryState;
  readonly retryCount: number;
  readonly lastAttemptAt?: string;
  readonly lastError?: string;
}

export interface SyncQueueSummary {
  readonly totalCount: number;
  readonly pendingCount: number;
  readonly inFlightCount: number;
  readonly failedCount: number;
  readonly nextRetryCount: number;
  readonly oldestQueuedAt: string | null;
}
