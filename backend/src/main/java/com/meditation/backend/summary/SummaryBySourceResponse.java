package com.meditation.backend.summary;

public record SummaryBySourceResponse(
    String source,
    int sessionLogs,
    int completedSessionLogs,
    int endedEarlySessionLogs,
    int totalDurationSeconds
) {
}
