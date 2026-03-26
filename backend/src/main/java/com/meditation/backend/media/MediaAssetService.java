package com.meditation.backend.media;

import com.meditation.backend.config.MediaStorageProperties;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MediaAssetService {

  static final String CUSTOM_PLAY_ASSET_KIND = "custom-play";

  private final MediaAssetRepository mediaAssetRepository;
  private final MediaStorageProperties mediaStorageProperties;

  public MediaAssetService(
      MediaAssetRepository mediaAssetRepository,
      MediaStorageProperties mediaStorageProperties
  ) {
    this.mediaAssetRepository = mediaAssetRepository;
    this.mediaStorageProperties = mediaStorageProperties;
  }

  public List<MediaAssetResponse> listCustomPlayMediaAssets() {
    return mediaAssetRepository.findByAssetKindAndActiveTrueOrderByLabelAsc(CUSTOM_PLAY_ASSET_KIND)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  private MediaAssetResponse toResponse(MediaAssetEntity entity) {
    return new MediaAssetResponse(
        entity.getId(),
        entity.getLabel(),
        mediaStorageProperties.toPublicPath(entity.getRelativePath()),
        entity.getRelativePath(),
        entity.getDurationSeconds(),
        entity.getMimeType(),
        entity.getSizeBytes(),
        entity.getUpdatedAt()
    );
  }
}
