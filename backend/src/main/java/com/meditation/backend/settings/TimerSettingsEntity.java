package com.meditation.backend.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "timer_settings")
public class TimerSettingsEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Column(name = "timer_mode", nullable = false, length = 32)
  private String timerMode;

  @Column(name = "meditation_type_code", length = 32)
  private String meditationTypeCode;

  @Column(name = "start_sound", nullable = false, length = 100)
  private String startSound;

  @Column(name = "end_sound", nullable = false, length = 100)
  private String endSound;

  @Column(name = "interval_enabled", nullable = false)
  private boolean intervalEnabled;

  @Column(name = "interval_minutes", nullable = false)
  private int intervalMinutes;

  @Column(name = "interval_sound", nullable = false, length = 100)
  private String intervalSound;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected TimerSettingsEntity() {
  }

  public TimerSettingsEntity(
      String id,
      int durationMinutes,
      String timerMode,
      String meditationTypeCode,
      String startSound,
      String endSound,
      boolean intervalEnabled,
      int intervalMinutes,
      String intervalSound,
      Instant updatedAt
  ) {
    this.id = id;
    this.durationMinutes = durationMinutes;
    this.timerMode = timerMode;
    this.meditationTypeCode = meditationTypeCode;
    this.startSound = startSound;
    this.endSound = endSound;
    this.intervalEnabled = intervalEnabled;
    this.intervalMinutes = intervalMinutes;
    this.intervalSound = intervalSound;
    this.updatedAt = updatedAt;
  }

  public String getId() {
    return id;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public String getTimerMode() {
    return timerMode;
  }

  public String getStartSound() {
    return startSound;
  }

  public String getEndSound() {
    return endSound;
  }

  public boolean isIntervalEnabled() {
    return intervalEnabled;
  }

  public int getIntervalMinutes() {
    return intervalMinutes;
  }

  public String getIntervalSound() {
    return intervalSound;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void updateFrom(TimerSettingsUpsertRequest request, int lastFixedDurationMinutes, Instant updatedAt) {
    this.durationMinutes = lastFixedDurationMinutes;
    this.timerMode = request.timerMode();
    this.meditationTypeCode = normalizeMeditationTypeCode(request.meditationType());
    this.startSound = request.startSound();
    this.endSound = request.endSound();
    this.intervalEnabled = request.intervalEnabled();
    this.intervalMinutes = request.intervalMinutes();
    this.intervalSound = request.intervalSound();
    this.updatedAt = updatedAt;
  }

  private static String normalizeMeditationTypeCode(String meditationType) {
    if (meditationType == null || meditationType.isBlank()) {
      return null;
    }

    return meditationType;
  }
}
