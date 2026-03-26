package com.meditation.backend.health;

import java.time.Instant;

public record ApiHealthResponse(
    String status,
    String application,
    Instant timestamp
) {
}
