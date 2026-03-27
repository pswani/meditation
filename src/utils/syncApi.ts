export const SYNC_QUEUED_AT_HEADER = 'X-Meditation-Sync-Queued-At';

export interface SyncMutationRequestOptions {
  readonly apiBaseUrl?: string;
  readonly signal?: AbortSignal;
  readonly syncQueuedAt?: string;
}

export function buildSyncMutationHeaders(syncQueuedAt?: string): HeadersInit | undefined {
  if (!syncQueuedAt) {
    return undefined;
  }

  return {
    [SYNC_QUEUED_AT_HEADER]: syncQueuedAt,
  };
}
