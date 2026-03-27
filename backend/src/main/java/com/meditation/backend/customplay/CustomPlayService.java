package com.meditation.backend.customplay;

import com.meditation.backend.media.MediaAssetRepository;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CustomPlayService {

  private static final String CUSTOM_PLAY_ASSET_KIND = "custom-play";
  private static final Set<String> MEDITATION_TYPES = Set.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");

  private final CustomPlayRepository customPlayRepository;
  private final MediaAssetRepository mediaAssetRepository;

  public CustomPlayService(
      CustomPlayRepository customPlayRepository,
      MediaAssetRepository mediaAssetRepository
  ) {
    this.customPlayRepository = customPlayRepository;
    this.mediaAssetRepository = mediaAssetRepository;
  }

  public List<CustomPlayResponse> listCustomPlays() {
    return customPlayRepository.findAllByOrderByCreatedAtDesc()
        .stream()
        .map(this::toResponse)
        .toList();
  }

  public CustomPlayResponse saveCustomPlay(String customPlayId, CustomPlayUpsertRequest request) {
    validateRequest(customPlayId, request);

    CustomPlayEntity existingEntity = customPlayRepository.findById(customPlayId).orElse(null);
    Instant now = Instant.now();
    CustomPlayEntity entity = new CustomPlayEntity(
        request.id(),
        request.name().trim(),
        request.meditationType(),
        request.durationMinutes(),
        request.startSound().trim(),
        request.endSound().trim(),
        normalizeOptionalText(request.mediaAssetId()),
        request.favorite(),
        normalizeOptionalText(request.recordingLabel()),
        existingEntity == null ? now : existingEntity.getCreatedAt(),
        now
    );

    return toResponse(customPlayRepository.save(entity));
  }

  public void deleteCustomPlay(String customPlayId) {
    customPlayRepository.deleteById(customPlayId);
  }

  private CustomPlayResponse toResponse(CustomPlayEntity entity) {
    return new CustomPlayResponse(
        entity.getId(),
        entity.getTitle(),
        entity.getMeditationTypeCode(),
        entity.getDurationMinutes(),
        entity.getStartSound(),
        entity.getEndSound(),
        entity.getMediaAssetId(),
        entity.getNotes(),
        entity.isFavorite(),
        entity.getCreatedAt(),
        entity.getUpdatedAt()
    );
  }

  private void validateRequest(String customPlayId, CustomPlayUpsertRequest request) {
    if (request.id() == null || request.id().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom play id is required.");
    }

    if (!request.id().equals(customPlayId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom play id must match the route id.");
    }

    if (request.name() == null || request.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom play name is required.");
    }

    if (!MEDITATION_TYPES.contains(request.meditationType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (request.durationMinutes() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be greater than 0.");
    }

    if (request.startSound() == null || request.startSound().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start sound is required.");
    }

    if (request.endSound() == null || request.endSound().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End sound is required.");
    }

    String mediaAssetId = normalizeOptionalText(request.mediaAssetId());
    if (mediaAssetId != null && !mediaAssetRepository.existsByIdAndAssetKindAndActiveTrue(mediaAssetId, CUSTOM_PLAY_ASSET_KIND)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked media session is invalid.");
    }
  }

  private String normalizeOptionalText(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }
}
