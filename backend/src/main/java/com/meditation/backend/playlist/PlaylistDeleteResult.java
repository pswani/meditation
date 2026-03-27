package com.meditation.backend.playlist;

public record PlaylistDeleteResult(
    String outcome,
    PlaylistResponse currentPlaylist
) {
}
