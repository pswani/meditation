package com.meditation.backend.sankalpa;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.meditation.backend.sync.GeneratedSyncContract;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SankalpaDeleteResult(
    String outcome,
    SankalpaProgressResponse currentRecord
) {
  @JsonProperty(GeneratedSyncContract.DELETE_SANKALPA_ALIAS_FIELD)
  public SankalpaProgressResponse currentSankalpa() {
    return currentRecord;
  }
}
