package com.meditation.backend.customplay;

import java.time.Instant;

public record CustomPlayResponse(
    String id,
    String name,
    String meditationType,
    int durationMinutes,
    String startSound,
    String endSound,
    String mediaAssetId,
    String recordingLabel,
    boolean favorite,
    Instant createdAt,
    Instant updatedAt
) {
}
