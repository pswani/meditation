package com.meditation.backend.customplay;

public record CustomPlayUpsertRequest(
    String id,
    String name,
    String meditationType,
    int durationMinutes,
    String startSound,
    String endSound,
    String mediaAssetId,
    String recordingLabel,
    boolean favorite,
    String createdAt,
    String updatedAt
) {
}
