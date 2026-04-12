package com.meditation.backend.settings;

import com.meditation.backend.reference.ReferenceData;
import com.meditation.backend.sync.GeneratedSyncContract;
import com.meditation.backend.sync.SyncMutationResult;
import com.meditation.backend.sync.SyncRequestSupport;
import java.time.Instant;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TimerSettingsService {

  static final String DEFAULT_SETTINGS_ID = "default";

  private final TimerSettingsRepository timerSettingsRepository;

  public TimerSettingsService(TimerSettingsRepository timerSettingsRepository) {
    this.timerSettingsRepository = timerSettingsRepository;
  }

  public TimerSettingsResponse getTimerSettings() {
    TimerSettingsEntity entity = timerSettingsRepository.findById(DEFAULT_SETTINGS_ID)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Default timer settings are missing."));

    return toResponse(entity);
  }

  public SyncMutationResult<TimerSettingsResponse> saveTimerSettings(
      TimerSettingsUpsertRequest request,
      String syncQueuedAtRaw
  ) {
    validateRequest(request);

    TimerSettingsEntity entity = timerSettingsRepository.findById(DEFAULT_SETTINGS_ID)
        .orElseGet(() -> new TimerSettingsEntity(
            DEFAULT_SETTINGS_ID,
            resolveLastFixedDurationMinutes(request, null),
            request.timerMode(),
            normalizeMeditationType(request.meditationType()),
            request.startSound(),
            request.endSound(),
            request.intervalEnabled(),
            request.intervalMinutes(),
            request.intervalSound(),
            Instant.now()
        ));

    if (SyncRequestSupport.isStaleMutation(entity.getUpdatedAt(), syncQueuedAtRaw)) {
      return new SyncMutationResult<>(GeneratedSyncContract.SYNC_OUTCOME_STALE, toResponse(entity));
    }

    Instant mutationTimestamp = SyncRequestSupport.resolveMutationTimestamp(syncQueuedAtRaw, Instant.now());
    entity.updateFrom(request, resolveLastFixedDurationMinutes(request, entity), mutationTimestamp);

    return new SyncMutationResult<>(
        GeneratedSyncContract.SYNC_OUTCOME_APPLIED,
        toResponse(timerSettingsRepository.save(entity))
    );
  }

  private TimerSettingsResponse toResponse(TimerSettingsEntity entity) {
    return new TimerSettingsResponse(
        entity.getId(),
        entity.getTimerMode(),
        "open-ended".equals(entity.getTimerMode()) ? null : entity.getDurationMinutes(),
        entity.getDurationMinutes(),
        Optional.ofNullable(entity.getMeditationTypeCode()).orElse(""),
        entity.getStartSound(),
        entity.getEndSound(),
        entity.isIntervalEnabled(),
        entity.getIntervalMinutes(),
        entity.getIntervalSound(),
        entity.getUpdatedAt()
    );
  }

  private void validateRequest(TimerSettingsUpsertRequest request) {
    if (!ReferenceData.isTimerMode(request.timerMode())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Timer mode is invalid.");
    }

    if ("fixed".equals(request.timerMode())) {
      if (request.durationMinutes() == null || request.durationMinutes() <= 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be greater than 0.");
      }
    } else if (request.durationMinutes() != null && request.durationMinutes() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open-ended duration must be omitted or greater than 0.");
    }

    if (request.startSound() == null || request.startSound().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start sound is required.");
    }

    if (request.endSound() == null || request.endSound().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End sound is required.");
    }

    if (request.intervalSound() == null || request.intervalSound().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interval sound is required.");
    }

    if (request.intervalMinutes() < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interval minutes must be 0 or greater.");
    }

    if (request.intervalEnabled() && request.intervalMinutes() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interval minutes must be greater than 0 when interval bell is enabled.");
    }

    if (
        "fixed".equals(request.timerMode()) &&
        request.durationMinutes() != null &&
        request.intervalEnabled() &&
        request.intervalMinutes() >= request.durationMinutes()
    ) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interval minutes must be less than the total duration.");
    }

    String meditationType = normalizeMeditationType(request.meditationType());
    if (meditationType != null && !ReferenceData.isMeditationType(meditationType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }
  }

  private String normalizeMeditationType(String meditationType) {
    if (meditationType == null || meditationType.isBlank()) {
      return null;
    }

    return meditationType;
  }

  private int resolveLastFixedDurationMinutes(TimerSettingsUpsertRequest request, TimerSettingsEntity existingEntity) {
    if (request.lastFixedDurationMinutes() != null && request.lastFixedDurationMinutes() > 0) {
      return request.lastFixedDurationMinutes();
    }

    if (request.durationMinutes() != null && request.durationMinutes() > 0) {
      return request.durationMinutes();
    }

    if (existingEntity != null && existingEntity.getDurationMinutes() > 0) {
      return existingEntity.getDurationMinutes();
    }

    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last fixed duration must be greater than 0.");
  }
}
