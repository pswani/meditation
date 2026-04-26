package com.meditation.backend.sankalpa;

import java.math.BigDecimal;
import java.util.List;

public record SankalpaProgressResponse(
    SankalpaGoalResponse goal,
    String status,
    String deadlineAt,
    int matchedSessionCount,
    int matchedDurationSeconds,
    int targetSessionCount,
    int targetDurationSeconds,
    int metRecurringWeekCount,
    int targetRecurringWeekCount,
    List<SankalpaRecurringWeekResponse> recurringWeeks,
    int matchedObservanceCount,
    int missedObservanceCount,
    int pendingObservanceCount,
    int targetObservanceCount,
    List<SankalpaObservanceDayResponse> observanceDays,
    BigDecimal progressRatio
) {
}
