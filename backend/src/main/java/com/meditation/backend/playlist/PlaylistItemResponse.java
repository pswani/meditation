package com.meditation.backend.playlist;

public record PlaylistItemResponse(
    String id,
    String meditationType,
    int durationMinutes
) {
}
