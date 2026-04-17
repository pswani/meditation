package com.meditation.backend.sankalpa;

public record SankalpaRecurringWeekResponse(
    int weekIndex,
    String startDate,
    String endDate,
    int qualifyingDayCount,
    int requiredQualifyingDayCount,
    String status
) {
}
