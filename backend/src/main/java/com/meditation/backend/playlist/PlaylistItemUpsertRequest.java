package com.meditation.backend.playlist;

public record PlaylistItemUpsertRequest(
    String id,
    String title,
    String meditationType,
    int durationMinutes,
    String customPlayId
) {
}
