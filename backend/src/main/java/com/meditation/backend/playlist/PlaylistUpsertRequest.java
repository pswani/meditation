package com.meditation.backend.playlist;

import java.util.List;

public record PlaylistUpsertRequest(
    String id,
    String name,
    String createdAt,
    String updatedAt,
    List<PlaylistItemUpsertRequest> items,
    boolean favorite
) {
}
