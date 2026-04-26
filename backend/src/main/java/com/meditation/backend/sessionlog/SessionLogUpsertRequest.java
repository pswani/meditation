package com.meditation.backend.sessionlog;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

public record SessionLogUpsertRequest(
    String id,
    String startedAt,
    String endedAt,
    String meditationType,
    String timerMode,
    Integer intendedDurationSeconds,
    @PositiveOrZero int completedDurationSeconds,
    String status,
    String source,
    String startSound,
    String endSound,
    boolean intervalEnabled,
    @Min(0) int intervalMinutes,
    String intervalSound,
    String playlistId,
    String playlistName,
    String playlistRunId,
    String playlistRunStartedAt,
    Integer playlistItemPosition,
    Integer playlistItemCount,
    String customPlayId,
    String customPlayName,
    String customPlayRecordingLabel
) {
}
