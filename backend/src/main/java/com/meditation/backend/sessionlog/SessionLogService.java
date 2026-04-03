package com.meditation.backend.sessionlog;

import com.meditation.backend.sync.SyncRequestSupport;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SessionLogService {

  private static final Set<String> MEDITATION_TYPES = Set.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");
  private static final Set<String> SESSION_LOG_STATUSES = Set.of("completed", "ended early");
  private static final Set<String> SESSION_LOG_SOURCES = Set.of("auto log", "manual log");
  private static final Set<String> TIMER_MODES = Set.of("fixed", "open-ended");

  private final SessionLogRepository sessionLogRepository;

  public SessionLogService(SessionLogRepository sessionLogRepository) {
    this.sessionLogRepository = sessionLogRepository;
  }

  public List<SessionLogResponse> listSessionLogs() {
    return sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc()
        .stream()
        .map(this::toResponse)
        .toList();
  }

  public SessionLogResponse createManualSessionLog(ManualSessionLogCreateRequest request) {
    validateManualCreateRequest(request);

    Instant endedAt = parseTimestamp(request.sessionTimestamp(), "Session timestamp must be a valid ISO timestamp.");
    if (endedAt.isAfter(Instant.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session timestamp cannot be in the future.");
    }

    int durationSeconds = (int) Math.round(request.durationMinutes() * 60);
    if (durationSeconds <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must resolve to at least 1 second.");
    }

    Instant createdAt = Instant.now();
    SessionLogEntity entity = new SessionLogEntity(
        "manual-log-" + UUID.randomUUID().toString().replace("-", ""),
        "manual log",
        "completed",
        request.meditationType(),
        "fixed",
        endedAt.minusSeconds(durationSeconds),
        endedAt,
        durationSeconds,
        durationSeconds,
        "None",
        "None",
        false,
        0,
        "None",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        createdAt
    );

    return toResponse(sessionLogRepository.save(entity));
  }

  public SessionLogResponse saveSessionLog(String sessionLogId, SessionLogUpsertRequest request, String syncQueuedAtRaw) {
    validateRequest(sessionLogId, request);

    Instant startedAt = parseTimestamp(request.startedAt(), "Started at must be a valid ISO timestamp.");
    Instant endedAt = parseTimestamp(request.endedAt(), "Ended at must be a valid ISO timestamp.");
    Instant playlistRunStartedAt = parseOptionalTimestamp(
        request.playlistRunStartedAt(),
        "Playlist run started at must be a valid ISO timestamp."
    );

    if (endedAt.isBefore(startedAt)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ended at must be on or after started at.");
    }

    SessionLogEntity existingEntity = sessionLogRepository.findById(sessionLogId).orElse(null);
    if (existingEntity != null && SyncRequestSupport.isStaleMutation(existingEntity.getCreatedAt(), syncQueuedAtRaw)) {
      return toResponse(existingEntity);
    }

    Instant mutationTimestamp = SyncRequestSupport.resolveMutationTimestamp(syncQueuedAtRaw, Instant.now());

    SessionLogEntity entity = new SessionLogEntity(
        request.id(),
        request.source(),
        request.status(),
        request.meditationType(),
        request.timerMode(),
        startedAt,
        endedAt,
        request.intendedDurationSeconds(),
        request.completedDurationSeconds(),
        request.startSound(),
        request.endSound(),
        request.intervalEnabled(),
        request.intervalMinutes(),
        request.intervalSound(),
        normalizeOptionalText(request.playlistId()),
        normalizeOptionalText(request.playlistName()),
        request.playlistItemPosition(),
        request.playlistItemCount(),
        normalizeOptionalText(request.playlistRunId()),
        playlistRunStartedAt,
        normalizeOptionalText(request.customPlayId()),
        normalizeOptionalText(request.customPlayName()),
        normalizeOptionalText(request.customPlayRecordingLabel()),
        existingEntity == null ? mutationTimestamp : existingEntity.getCreatedAt()
    );

    return toResponse(sessionLogRepository.save(entity));
  }

  private SessionLogResponse toResponse(SessionLogEntity entity) {
    return new SessionLogResponse(
        entity.getId(),
        entity.getStartedAt().toString(),
        entity.getEndedAt().toString(),
        entity.getMeditationTypeCode(),
        entity.getTimerMode(),
        entity.getPlannedDurationSeconds(),
        entity.getCompletedDurationSeconds(),
        entity.getStatus(),
        entity.getSource(),
        entity.getStartSound(),
        entity.getEndSound(),
        entity.isIntervalEnabled(),
        entity.getIntervalMinutes(),
        entity.getIntervalSound(),
        entity.getPlaylistId(),
        entity.getPlaylistName(),
        entity.getPlaylistRunId(),
        entity.getPlaylistRunStartedAt() == null ? null : entity.getPlaylistRunStartedAt().toString(),
        entity.getPlaylistItemPosition(),
        entity.getPlaylistItemCount(),
        entity.getCustomPlayId(),
        entity.getCustomPlayName(),
        entity.getCustomPlayRecordingLabel(),
        entity.getCreatedAt()
    );
  }

  private void validateManualCreateRequest(ManualSessionLogCreateRequest request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Manual log request is required.");
    }

    if (request.durationMinutes() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must be greater than 0.");
    }

    if (!MEDITATION_TYPES.contains(request.meditationType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    parseTimestamp(request.sessionTimestamp(), "Session timestamp must be a valid ISO timestamp.");
  }

  private void validateRequest(String sessionLogId, SessionLogUpsertRequest request) {
    if (request.id() == null || request.id().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log id is required.");
    }

    if (!request.id().equals(sessionLogId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log id must match the route id.");
    }

    if (!MEDITATION_TYPES.contains(request.meditationType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (!SESSION_LOG_STATUSES.contains(request.status())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log status is invalid.");
    }

    if (!SESSION_LOG_SOURCES.contains(request.source())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log source is invalid.");
    }

    if (!TIMER_MODES.contains(request.timerMode())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Timer mode is invalid.");
    }

    if ("fixed".equals(request.timerMode())) {
      if (request.intendedDurationSeconds() == null || request.intendedDurationSeconds() <= 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intended duration must be greater than 0.");
      }

      if (request.completedDurationSeconds() < 0 || request.completedDurationSeconds() > request.intendedDurationSeconds()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed duration must be between 0 and intended duration.");
      }
    } else if (request.intendedDurationSeconds() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open-ended session logs cannot include an intended duration.");
    } else if (request.completedDurationSeconds() < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed duration must be 0 or greater.");
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

    if (request.playlistItemPosition() != null && request.playlistItemPosition() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item position must be greater than 0.");
    }

    if (request.playlistItemCount() != null && request.playlistItemCount() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item count must be greater than 0.");
    }

    if (request.playlistItemPosition() != null && request.playlistItemCount() != null
        && request.playlistItemPosition() > request.playlistItemCount()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item position cannot exceed item count.");
    }

    if (request.customPlayId() != null && request.customPlayId().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom play id cannot be blank.");
    }

    if (request.customPlayName() != null && request.customPlayName().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Custom play name cannot be blank.");
    }

    parseTimestamp(request.startedAt(), "Started at must be a valid ISO timestamp.");
    parseTimestamp(request.endedAt(), "Ended at must be a valid ISO timestamp.");
    parseOptionalTimestamp(request.playlistRunStartedAt(), "Playlist run started at must be a valid ISO timestamp.");
  }

  private Instant parseTimestamp(String value, String errorMessage) {
    if (value == null || value.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
    }

    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
    }
  }

  private Instant parseOptionalTimestamp(String value, String errorMessage) {
    if (value == null || value.isBlank()) {
      return null;
    }

    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
    }
  }

  private String normalizeOptionalText(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value;
  }
}
