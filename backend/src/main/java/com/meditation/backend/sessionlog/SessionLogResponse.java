package com.meditation.backend.sessionlog;

import java.time.Instant;

public record SessionLogResponse(
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
    Integer playlistItemCount,
    String customPlayId,
    String customPlayName,
    String customPlayRecordingLabel,
    Instant createdAt
) {
}
