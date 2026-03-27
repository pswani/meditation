package com.meditation.backend.playlist;

import java.time.Instant;
import java.util.List;

public record PlaylistResponse(
    String id,
    String name,
    List<PlaylistItemResponse> items,
    boolean favorite,
    Instant createdAt,
    Instant updatedAt
) {
}
