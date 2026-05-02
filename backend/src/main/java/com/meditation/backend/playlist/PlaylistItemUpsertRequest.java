package com.meditation.backend.playlist;

import jakarta.validation.constraints.Positive;

public record PlaylistItemUpsertRequest(
    String id,
    String title,
    String meditationType,
    @Positive int durationMinutes,
    String customPlayId
) {
}
