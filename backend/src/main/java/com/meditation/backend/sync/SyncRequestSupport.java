package com.meditation.backend.sync;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class SyncRequestSupport {

  public static final String SYNC_QUEUED_AT_HEADER = "X-Meditation-Sync-Queued-At";

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
}
