package com.meditation.backend.sankalpa;

public record SankalpaObservanceDayResponse(
    String date,
    String status,
    boolean isFuture
) {
}
