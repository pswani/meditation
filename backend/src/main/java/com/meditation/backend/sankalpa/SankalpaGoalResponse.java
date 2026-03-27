package com.meditation.backend.sankalpa;

public record SankalpaGoalResponse(
    String id,
    String goalType,
    double targetValue,
    int days,
    String meditationType,
    String timeOfDayBucket,
    String createdAt
) {
}
