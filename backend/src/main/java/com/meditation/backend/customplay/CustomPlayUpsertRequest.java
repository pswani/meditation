package com.meditation.backend.customplay;

import jakarta.validation.constraints.Positive;

public record CustomPlayUpsertRequest(
    String id,
    String name,
    String meditationType,
    @Positive int durationMinutes,
    String startSound,
    String endSound,
    String mediaAssetId,
    String recordingLabel,
    boolean favorite,
    String createdAt,
    String updatedAt
) {
}
