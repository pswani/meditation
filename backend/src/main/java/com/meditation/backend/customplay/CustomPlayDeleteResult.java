package com.meditation.backend.customplay;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.meditation.backend.sync.GeneratedSyncContract;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CustomPlayDeleteResult(
    String outcome,
    CustomPlayResponse currentRecord
) {
  @JsonProperty(GeneratedSyncContract.DELETE_CUSTOM_PLAY_ALIAS_FIELD)
  public CustomPlayResponse currentCustomPlay() {
    return currentRecord;
  }
}
