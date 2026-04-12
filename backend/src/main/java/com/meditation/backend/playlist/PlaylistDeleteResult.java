package com.meditation.backend.playlist;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.meditation.backend.sync.GeneratedSyncContract;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PlaylistDeleteResult(
    String outcome,
    PlaylistResponse currentRecord
) {
  @JsonProperty(GeneratedSyncContract.DELETE_PLAYLIST_ALIAS_FIELD)
  public PlaylistResponse currentPlaylist() {
    return currentRecord;
  }
}
