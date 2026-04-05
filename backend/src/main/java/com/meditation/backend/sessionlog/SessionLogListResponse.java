package com.meditation.backend.sessionlog;

import java.util.List;

public record SessionLogListResponse(
    List<SessionLogResponse> items,
    int page,
    int size,
    long totalItems,
    boolean hasNextPage
) {
}
