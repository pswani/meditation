package com.meditation.backend.playlist;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "playlist")
public class PlaylistEntity {

  @Id
  @Column(name = "id", nullable = false, length = 64)
  private String id;

  @Column(name = "name", nullable = false, length = 160)
  private String name;

  @Column(name = "favorite", nullable = false)
  private boolean favorite;

  @Column(name = "small_gap_seconds", nullable = false)
  private int smallGapSeconds;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected PlaylistEntity() {
  }

  public PlaylistEntity(
      String id,
      String name,
      boolean favorite,
      int smallGapSeconds,
      Instant createdAt,
      Instant updatedAt
  ) {
    this.id = id;
    this.name = name;
    this.favorite = favorite;
    this.smallGapSeconds = smallGapSeconds;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public boolean isFavorite() {
    return favorite;
  }

  public int getSmallGapSeconds() {
    return smallGapSeconds;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
