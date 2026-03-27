package com.meditation.backend.summary;

public record SummaryByTypeResponse(
    String meditationType,
    int sessionLogs,
    int totalDurationSeconds
) {
}
