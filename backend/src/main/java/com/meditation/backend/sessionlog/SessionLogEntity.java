package com.meditation.backend.sessionlog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "session_log")
public class SessionLogEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "source", nullable = false, length = 32)
  private String source;

  @Column(name = "status", nullable = false, length = 32)
  private String status;

  @Column(name = "meditation_type_code", nullable = false, length = 32)
  private String meditationTypeCode;

  @Column(name = "timer_mode", nullable = false, length = 32)
  private String timerMode;

  @Column(name = "started_at", nullable = false)
  private Instant startedAt;

  @Column(name = "ended_at", nullable = false)
  private Instant endedAt;

  @Column(name = "planned_duration_seconds")
  private Integer plannedDurationSeconds;

  @Column(name = "completed_duration_seconds", nullable = false)
  private int completedDurationSeconds;

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

  @Column(name = "playlist_id", length = 64)
  private String playlistId;

  @Column(name = "playlist_name", length = 160)
  private String playlistName;

  @Column(name = "playlist_item_position")
  private Integer playlistItemPosition;

  @Column(name = "playlist_item_count")
  private Integer playlistItemCount;

  @Column(name = "playlist_run_id", length = 64)
  private String playlistRunId;

  @Column(name = "playlist_run_started_at")
  private Instant playlistRunStartedAt;

  @Column(name = "custom_play_id", length = 64)
  private String customPlayId;

  @Column(name = "custom_play_name", length = 160)
  private String customPlayName;

  @Column(name = "custom_play_recording_label", length = 500)
  private String customPlayRecordingLabel;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected SessionLogEntity() {
  }

  public SessionLogEntity(
      String id,
      String source,
      String status,
      String meditationTypeCode,
      String timerMode,
      Instant startedAt,
      Instant endedAt,
      Integer plannedDurationSeconds,
      int completedDurationSeconds,
      String startSound,
      String endSound,
      boolean intervalEnabled,
      int intervalMinutes,
      String intervalSound,
      String playlistId,
      String playlistName,
      Integer playlistItemPosition,
      Integer playlistItemCount,
      String playlistRunId,
      Instant playlistRunStartedAt,
      String customPlayId,
      String customPlayName,
      String customPlayRecordingLabel,
      Instant createdAt
  ) {
    this.id = id;
    this.source = source;
    this.status = status;
    this.meditationTypeCode = meditationTypeCode;
    this.timerMode = timerMode;
    this.startedAt = startedAt;
    this.endedAt = endedAt;
    this.plannedDurationSeconds = plannedDurationSeconds;
    this.completedDurationSeconds = completedDurationSeconds;
    this.startSound = startSound;
    this.endSound = endSound;
    this.intervalEnabled = intervalEnabled;
    this.intervalMinutes = intervalMinutes;
    this.intervalSound = intervalSound;
    this.playlistId = playlistId;
    this.playlistName = playlistName;
    this.playlistItemPosition = playlistItemPosition;
    this.playlistItemCount = playlistItemCount;
    this.playlistRunId = playlistRunId;
    this.playlistRunStartedAt = playlistRunStartedAt;
    this.customPlayId = customPlayId;
    this.customPlayName = customPlayName;
    this.customPlayRecordingLabel = customPlayRecordingLabel;
    this.createdAt = createdAt;
  }

  public String getId() {
    return id;
  }

  public String getSource() {
    return source;
  }

  public String getStatus() {
    return status;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public Instant getStartedAt() {
    return startedAt;
  }

  public String getTimerMode() {
    return timerMode;
  }

  public Instant getEndedAt() {
    return endedAt;
  }

  public Integer getPlannedDurationSeconds() {
    return plannedDurationSeconds;
  }

  public int getCompletedDurationSeconds() {
    return completedDurationSeconds;
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

  public String getPlaylistId() {
    return playlistId;
  }

  public String getPlaylistName() {
    return playlistName;
  }

  public Integer getPlaylistItemPosition() {
    return playlistItemPosition;
  }

  public Integer getPlaylistItemCount() {
    return playlistItemCount;
  }

  public String getPlaylistRunId() {
    return playlistRunId;
  }

  public Instant getPlaylistRunStartedAt() {
    return playlistRunStartedAt;
  }

  public String getCustomPlayId() {
    return customPlayId;
  }

  public String getCustomPlayName() {
    return customPlayName;
  }

  public String getCustomPlayRecordingLabel() {
    return customPlayRecordingLabel;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
