package com.meditation.backend.summary;

public record SummaryOverallResponse(
    int totalSessionLogs,
    int completedSessionLogs,
    int endedEarlySessionLogs,
    int totalDurationSeconds,
    int averageDurationSeconds,
    int autoLogs,
    int manualLogs
) {
}
