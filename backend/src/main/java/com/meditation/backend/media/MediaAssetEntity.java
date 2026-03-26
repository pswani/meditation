package com.meditation.backend.media;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "media_asset")
public class MediaAssetEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "asset_kind", nullable = false, length = 32)
  private String assetKind;

  @Column(name = "label", nullable = false, length = 160)
  private String label;

  @Column(name = "meditation_type_code", length = 32)
  private String meditationTypeCode;

  @Column(name = "relative_path", nullable = false, length = 255)
  private String relativePath;

  @Column(name = "duration_seconds", nullable = false)
  private int durationSeconds;

  @Column(name = "mime_type", nullable = false, length = 100)
  private String mimeType;

  @Column(name = "size_bytes", nullable = false)
  private long sizeBytes;

  @Column(name = "active", nullable = false)
  private boolean active;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected MediaAssetEntity() {
  }

  public String getId() {
    return id;
  }

  public String getAssetKind() {
    return assetKind;
  }

  public String getLabel() {
    return label;
  }

  public String getMeditationTypeCode() {
    return meditationTypeCode;
  }

  public String getRelativePath() {
    return relativePath;
  }

  public int getDurationSeconds() {
    return durationSeconds;
  }

  public String getMimeType() {
    return mimeType;
  }

  public long getSizeBytes() {
    return sizeBytes;
  }

  public boolean isActive() {
    return active;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
