package com.meditation.backend.settings;

public record TimerSettingsUpsertRequest(
    int durationMinutes,
    String meditationType,
    String startSound,
    String endSound,
    boolean intervalEnabled,
    int intervalMinutes,
    String intervalSound
) {
}
