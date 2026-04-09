package com.meditation.backend.sankalpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "sankalpa_observance_entry")
@IdClass(SankalpaObservanceEntryId.class)
public class SankalpaObservanceEntryEntity {

  @Id
  @Column(name = "sankalpa_id", nullable = false, length = 64)
  private String sankalpaId;

  @Id
  @Column(name = "observance_date", nullable = false)
  private LocalDate observanceDate;

  @Column(name = "status", nullable = false, length = 16)
  private String status;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected SankalpaObservanceEntryEntity() {
  }

  public SankalpaObservanceEntryEntity(String sankalpaId, LocalDate observanceDate, String status, Instant updatedAt) {
    this.sankalpaId = sankalpaId;
    this.observanceDate = observanceDate;
    this.status = status;
    this.updatedAt = updatedAt;
  }

  public String getSankalpaId() {
    return sankalpaId;
  }

  public LocalDate getObservanceDate() {
    return observanceDate;
  }

  public String getStatus() {
    return status;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
