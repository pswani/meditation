package com.meditation.backend.sankalpa;

import java.util.List;

public record SankalpaGoalResponse(
    String id,
    String goalType,
    double targetValue,
    int days,
    Integer qualifyingDaysPerWeek,
    String meditationType,
    String timeOfDayBucket,
    String observanceLabel,
    List<SankalpaObservanceRecordPayload> observanceRecords,
    String createdAt,
    boolean archived
) {
}
