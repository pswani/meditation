package com.meditation.backend.sankalpa;

public record SankalpaProgressResponse(
    SankalpaGoalResponse goal,
    String status,
    String deadlineAt,
    int matchedSessionCount,
    int matchedDurationSeconds,
    int targetSessionCount,
    int targetDurationSeconds,
    double progressRatio
) {
}
