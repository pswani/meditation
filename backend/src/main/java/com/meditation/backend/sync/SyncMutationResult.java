package com.meditation.backend.sync;

public record SyncMutationResult<T>(
    String outcome,
    T record
) {
}
