import {
  syncDeleteCurrentRecordField,
  syncOutcomeApplied,
  syncOutcomeDeleted,
  syncOutcomeStale,
  syncQueuedAtHeader,
  syncResultHeader,
} from '../generated/syncContract';

export const SYNC_QUEUED_AT_HEADER = syncQueuedAtHeader;
export const SYNC_RESULT_HEADER = syncResultHeader;
export const SYNC_OUTCOME_APPLIED = syncOutcomeApplied;
export const SYNC_OUTCOME_STALE = syncOutcomeStale;
export const SYNC_OUTCOME_DELETED = syncOutcomeDeleted;

export type SyncMutationOutcome =
  | typeof SYNC_OUTCOME_APPLIED
  | typeof SYNC_OUTCOME_STALE
  | typeof SYNC_OUTCOME_DELETED;

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

export function isSyncMutationOutcome(value: unknown): value is SyncMutationOutcome {
  return value === SYNC_OUTCOME_APPLIED || value === SYNC_OUTCOME_STALE || value === SYNC_OUTCOME_DELETED;
}

export function extractSyncDeleteCurrentRecord(
  payload: Record<string, unknown>,
  legacyAliasFields: readonly string[] = []
): unknown {
  if (syncDeleteCurrentRecordField in payload) {
    return payload[syncDeleteCurrentRecordField];
  }

  for (const aliasField of legacyAliasFields) {
    if (aliasField in payload) {
      return payload[aliasField];
    }
  }

  return undefined;
}
