package com.meditation.backend.sessionlog;

public record ManualSessionLogCreateRequest(
    double durationMinutes,
    String meditationType,
    String sessionTimestamp
) {
}
