package com.meditation.backend.playlist;

import java.util.List;

public record PlaylistUpsertRequest(
    String id,
    String name,
    List<PlaylistItemUpsertRequest> items,
    boolean favorite
) {
}
