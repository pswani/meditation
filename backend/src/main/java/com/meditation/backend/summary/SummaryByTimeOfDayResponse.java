package com.meditation.backend.summary;

public record SummaryByTimeOfDayResponse(
    String timeOfDayBucket,
    int sessionLogs,
    int completedSessionLogs,
    int endedEarlySessionLogs,
    int totalDurationSeconds
) {
}
