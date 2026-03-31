package com.meditation.backend.settings;

import java.time.Instant;

public record TimerSettingsResponse(
    String id,
    String timerMode,
    int durationMinutes,
    String meditationType,
    String startSound,
    String endSound,
    boolean intervalEnabled,
    int intervalMinutes,
    String intervalSound,
    Instant updatedAt
) {
}
