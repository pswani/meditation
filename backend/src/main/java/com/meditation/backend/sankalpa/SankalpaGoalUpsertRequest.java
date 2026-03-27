package com.meditation.backend.sankalpa;

import java.math.BigDecimal;

public record SankalpaGoalUpsertRequest(
    String id,
    String goalType,
    BigDecimal targetValue,
    int days,
    String meditationType,
    String timeOfDayBucket,
    String createdAt
) {
}
