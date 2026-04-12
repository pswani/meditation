package com.meditation.backend.sync;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

public final class SyncRequestSupport {

  public static final String SYNC_QUEUED_AT_HEADER = GeneratedSyncContract.SYNC_QUEUED_AT_HEADER;
  public static final String SYNC_RESULT_HEADER = GeneratedSyncContract.SYNC_RESULT_HEADER;
  public static final String SYNC_OUTCOME_APPLIED = GeneratedSyncContract.SYNC_OUTCOME_APPLIED;
  public static final String SYNC_OUTCOME_STALE = GeneratedSyncContract.SYNC_OUTCOME_STALE;
  public static final String SYNC_OUTCOME_DELETED = GeneratedSyncContract.SYNC_OUTCOME_DELETED;

  private SyncRequestSupport() {
  }

  public static Instant parseOptionalSyncQueuedAt(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sync queued at must be a valid ISO timestamp.");
    }
  }

  public static Instant resolveMutationTimestamp(String syncQueuedAtRaw, Instant fallback) {
    Instant syncQueuedAt = parseOptionalSyncQueuedAt(syncQueuedAtRaw);
    return syncQueuedAt != null ? syncQueuedAt : fallback;
  }

  public static boolean isStaleMutation(Instant existingUpdatedAt, String syncQueuedAtRaw) {
    Instant syncQueuedAt = parseOptionalSyncQueuedAt(syncQueuedAtRaw);
    return syncQueuedAt != null && existingUpdatedAt != null && existingUpdatedAt.isAfter(syncQueuedAt);
  }

  public static <T> ResponseEntity<T> mutationResponse(SyncMutationResult<T> result) {
    return ResponseEntity.ok()
        .header(SYNC_RESULT_HEADER, result.outcome())
        .body(result.record());
  }

  public static <T> ResponseEntity<T> deleteResponse(String outcome, T stalePayload) {
    if (SYNC_OUTCOME_STALE.equals(outcome)) {
      return ResponseEntity.ok()
          .header(SYNC_RESULT_HEADER, SYNC_OUTCOME_STALE)
          .body(stalePayload);
    }

    return ResponseEntity.noContent()
        .header(SYNC_RESULT_HEADER, SYNC_OUTCOME_DELETED)
        .build();
  }
}
