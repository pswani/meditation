package com.meditation.backend.sankalpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "sankalpa_goal")
public class SankalpaGoalEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "goal_type", nullable = false, length = 32)
  private String goalType;

  @Column(name = "target_value", nullable = false, precision = 10, scale = 2)
  private BigDecimal targetValue;

  @Column(name = "days", nullable = false)
  private int days;

  @Column(name = "meditation_type_code", length = 32)
  private String meditationTypeCode;

  @Column(name = "time_of_day_bucket", length = 32)
  private String timeOfDayBucket;

  @Column(name = "observance_label", length = 120)
  private String observanceLabel;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "completed_at")
  private Instant completedAt;

  @Column(name = "archived", nullable = false)
  private boolean archived;

  protected SankalpaGoalEntity() {
  }

  public SankalpaGoalEntity(
      String id,
      String goalType,
      BigDecimal targetValue,
      int days,
      String meditationTypeCode,
      String timeOfDayBucket,
      String observanceLabel,
      Instant createdAt,
      Instant updatedAt,
      Instant completedAt,
      boolean archived
  ) {
    this.id = id;
    this.goalType = goalType;
    this.targetValue = targetValue;
    this.days = days;
    this.meditationTypeCode = meditationTypeCode;
    this.timeOfDayBucket = timeOfDayBucket;
    this.observanceLabel = observanceLabel;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = completedAt;
    this.archived = archived;
  }

  public String getId() {
    return id;
  }

  public String getGoalType() {
    return goalType;
  }

  public BigDecimal getTargetValue() {
    return targetValue;
  }

  public int getDays() {
    return days;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public String getTimeOfDayBucket() {
    return timeOfDayBucket;
  }

  public String getObservanceLabel() {
    return observanceLabel;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public boolean isArchived() {
    return archived;
  }

  public void updateFrom(SankalpaGoalUpsertRequest request, Instant createdAt, Instant updatedAt) {
    this.goalType = request.goalType();
    this.targetValue = request.targetValue();
    this.days = request.days();
    this.meditationTypeCode = request.meditationType();
    this.timeOfDayBucket = request.timeOfDayBucket();
    this.observanceLabel = request.observanceLabel();
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = null;
    this.archived = request.archived();
  }

  public void setCompletedAt(Instant completedAt) {
    this.completedAt = completedAt;
  }
}
