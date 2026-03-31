package com.meditation.backend.sessionlog;

public record SessionLogUpsertRequest(
    String id,
    String startedAt,
    String endedAt,
    String meditationType,
    String timerMode,
    Integer intendedDurationSeconds,
    int completedDurationSeconds,
    String status,
    String source,
    String startSound,
    String endSound,
    boolean intervalEnabled,
    int intervalMinutes,
    String intervalSound,
    String playlistId,
    String playlistName,
    String playlistRunId,
    String playlistRunStartedAt,
    Integer playlistItemPosition,
    Integer playlistItemCount
) {
}
