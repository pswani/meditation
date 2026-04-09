package com.meditation.backend.sankalpa;

import java.util.List;
import java.math.BigDecimal;

public record SankalpaGoalUpsertRequest(
    String id,
    String goalType,
    BigDecimal targetValue,
    int days,
    String meditationType,
    String timeOfDayBucket,
    String observanceLabel,
    List<SankalpaObservanceRecordPayload> observanceRecords,
    String createdAt,
    boolean archived
) {
}
