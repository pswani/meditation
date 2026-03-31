package com.meditation.backend.settings;

public record TimerSettingsUpsertRequest(
    String timerMode,
    Integer durationMinutes,
    Integer lastFixedDurationMinutes,
    String meditationType,
    String startSound,
    String endSound,
    boolean intervalEnabled,
    int intervalMinutes,
    String intervalSound
) {
}
