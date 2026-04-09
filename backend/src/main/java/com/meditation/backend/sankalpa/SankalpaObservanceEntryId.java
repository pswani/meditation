package com.meditation.backend.sankalpa;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

public class SankalpaObservanceEntryId implements Serializable {

  private String sankalpaId;
  private LocalDate observanceDate;

  public SankalpaObservanceEntryId() {
  }

  public SankalpaObservanceEntryId(String sankalpaId, LocalDate observanceDate) {
    this.sankalpaId = sankalpaId;
    this.observanceDate = observanceDate;
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }
    if (!(other instanceof SankalpaObservanceEntryId that)) {
      return false;
    }
    return Objects.equals(sankalpaId, that.sankalpaId) && Objects.equals(observanceDate, that.observanceDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(sankalpaId, observanceDate);
  }
}
