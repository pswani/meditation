package com.meditation.backend.playlist;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "playlist_item")
public class PlaylistItemEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  @Column(name = "playlist_id", nullable = false, length = 64)
  private String playlistId;

  @Column(name = "external_id", nullable = false, length = 64)
  private String externalId;

  @Column(name = "position_index", nullable = false)
  private int positionIndex;

  @Column(name = "meditation_type_code", nullable = false, length = 32)
  private String meditationTypeCode;

  @Column(name = "title", nullable = false, length = 160)
  private String title;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Column(name = "custom_play_id", length = 64)
  private String customPlayId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected PlaylistItemEntity() {
  }

  public PlaylistItemEntity(
      String playlistId,
      String externalId,
      int positionIndex,
      String meditationTypeCode,
      String title,
      int durationMinutes,
      String customPlayId,
      Instant createdAt
  ) {
    this.playlistId = playlistId;
    this.externalId = externalId;
    this.positionIndex = positionIndex;
    this.meditationTypeCode = meditationTypeCode;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.customPlayId = customPlayId;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public String getPlaylistId() {
    return playlistId;
  }

  public String getExternalId() {
    return externalId;
  }

  public int getPositionIndex() {
    return positionIndex;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public String getTitle() {
    return title;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public String getCustomPlayId() {
    return customPlayId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
