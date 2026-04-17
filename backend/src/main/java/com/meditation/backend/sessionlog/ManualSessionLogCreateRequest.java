package com.meditation.backend.sessionlog;

public record ManualSessionLogCreateRequest(
    String timerMode,
    double durationMinutes,
    String meditationType,
    String sessionTimestamp
) {
}
