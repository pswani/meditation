package com.meditation.backend.playlist;

public record PlaylistItemUpsertRequest(
    String id,
    String meditationType,
    int durationMinutes
) {
}
