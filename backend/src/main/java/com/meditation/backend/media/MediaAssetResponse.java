package com.meditation.backend.media;

import java.time.Instant;

public record MediaAssetResponse(
    String id,
    String label,
    String meditationType,
    String filePath,
    String relativePath,
    int durationSeconds,
    String mimeType,
    long sizeBytes,
    Instant updatedAt
) {
}
