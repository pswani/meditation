package com.meditation.backend.sessionlog;

import com.meditation.backend.sync.SyncRequestSupport;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SessionLogService {

  private static final Set<String> MEDITATION_TYPES = Set.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");
  private static final Set<String> SESSION_LOG_STATUSES = Set.of("completed", "ended early");
  private static final Set<String> SESSION_LOG_SOURCES = Set.of("auto log", "manual log");
  private static final Set<String> TIMER_MODES = Set.of("fixed", "open-ended");
  private static final int MAX_PAGE_SIZE = 200;

  private final SessionLogRepository sessionLogRepository;

  public SessionLogService(SessionLogRepository sessionLogRepository) {
    this.sessionLogRepository = sessionLogRepository;
  }

  public SessionLogListResponse listSessionLogs(
      String startAtRaw,
      String endAtRaw,
      String meditationTypeRaw,
      String sourceRaw,
      Integer pageRaw,
      Integer sizeRaw
  ) {
    SessionLogFilters filters = parseFilters(startAtRaw, endAtRaw, meditationTypeRaw, sourceRaw);
    SessionLogPageRequest pageRequest = parsePageRequest(pageRaw, sizeRaw);

    if (pageRequest == null) {
      List<SessionLogResponse> items = sessionLogRepository.findAllMatching(
              filters.startAt(),
              filters.endAt(),
              filters.meditationType(),
              filters.source()
          )
          .stream()
          .map(this::toResponse)
          .toList();
      return new SessionLogListResponse(items, 0, items.size(), items.size(), false);
    }

    Page<SessionLogEntity> page = sessionLogRepository.findPageMatching(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source(),
        PageRequest.of(
            pageRequest.page(),
            pageRequest.size(),
            Sort.by(Sort.Order.desc("endedAt"), Sort.Order.desc("createdAt"))
        )
    );

    return new SessionLogListResponse(
        page.getContent().stream().map(this::toResponse).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.hasNext()
    );
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

    return value.trim();
  }

  private SessionLogFilters parseFilters(
      String startAtRaw,
      String endAtRaw,
      String meditationTypeRaw,
      String sourceRaw
  ) {
    Instant startAt = parseOptionalTimestamp(startAtRaw, "Start at must be a valid ISO timestamp.");
    Instant endAt = parseOptionalTimestamp(endAtRaw, "End at must be a valid ISO timestamp.");
    String meditationType = normalizeOptionalText(meditationTypeRaw);
    String source = normalizeOptionalText(sourceRaw);

    if (startAt != null && endAt != null && startAt.isAfter(endAt)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start at must be on or before end at.");
    }

    if (meditationType != null && !MEDITATION_TYPES.contains(meditationType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (source != null && !SESSION_LOG_SOURCES.contains(source)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log source is invalid.");
    }

    return new SessionLogFilters(startAt, endAt, meditationType, source);
  }

  private SessionLogPageRequest parsePageRequest(Integer pageRaw, Integer sizeRaw) {
    if (pageRaw == null && sizeRaw == null) {
      return null;
    }

    if (pageRaw == null || sizeRaw == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page and size must be provided together.");
    }

    if (pageRaw < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be 0 or greater.");
    }

    if (sizeRaw <= 0 || sizeRaw > MAX_PAGE_SIZE) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 200.");
    }

    return new SessionLogPageRequest(pageRaw, sizeRaw);
  }

  private record SessionLogFilters(Instant startAt, Instant endAt, String meditationType, String source) {
  }

  private record SessionLogPageRequest(int page, int size) {
  }
}
