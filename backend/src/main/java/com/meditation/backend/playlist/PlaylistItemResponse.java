package com.meditation.backend.playlist;

public record PlaylistItemResponse(
    String id,
    String title,
    String meditationType,
    int durationMinutes,
    String customPlayId
) {
}
