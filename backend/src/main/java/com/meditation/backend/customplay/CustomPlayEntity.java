package com.meditation.backend.customplay;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "custom_play")
public class CustomPlayEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "title", nullable = false, length = 160)
  private String title;

  @Column(name = "meditation_type_code", nullable = false, length = 32)
  private String meditationTypeCode;

  @Column(name = "duration_minutes", nullable = false)
  private int durationMinutes;

  @Column(name = "start_sound", nullable = false, length = 100)
  private String startSound;

  @Column(name = "end_sound", nullable = false, length = 100)
  private String endSound;

  @Column(name = "media_asset_id", length = 64)
  private String mediaAssetId;

  @Column(name = "favorite", nullable = false)
  private boolean favorite;

  @Column(name = "notes", length = 500)
  private String notes;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected CustomPlayEntity() {
  }

  public CustomPlayEntity(
      String id,
      String title,
      String meditationTypeCode,
      int durationMinutes,
      String startSound,
      String endSound,
      String mediaAssetId,
      boolean favorite,
      String notes,
      Instant createdAt,
      Instant updatedAt
  ) {
    this.id = id;
    this.title = title;
    this.meditationTypeCode = meditationTypeCode;
    this.durationMinutes = durationMinutes;
    this.startSound = startSound;
    this.endSound = endSound;
    this.mediaAssetId = mediaAssetId;
    this.favorite = favorite;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public int getDurationMinutes() {
    return durationMinutes;
  }

  public String getStartSound() {
    return startSound;
  }

  public String getEndSound() {
    return endSound;
  }

  public String getMediaAssetId() {
    return mediaAssetId;
  }

  public boolean isFavorite() {
    return favorite;
  }

  public String getNotes() {
    return notes;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
