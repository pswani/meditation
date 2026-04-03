package com.meditation.backend.sankalpa;

import com.meditation.backend.sessionlog.SessionLogEntity;
import com.meditation.backend.sessionlog.SessionLogRepository;
import java.math.BigDecimal;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SankalpaService {

  private static final long DAY_SECONDS = 24L * 60L * 60L;
  private static final Set<String> MEDITATION_TYPES = Set.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");
  private static final Set<String> GOAL_TYPES = Set.of("duration-based", "session-count-based");
  private static final Set<String> TIME_OF_DAY_BUCKETS = Set.of("morning", "afternoon", "evening", "night");

  private final SankalpaGoalRepository sankalpaGoalRepository;
  private final SessionLogRepository sessionLogRepository;

  public SankalpaService(
      SankalpaGoalRepository sankalpaGoalRepository,
      SessionLogRepository sessionLogRepository
  ) {
    this.sankalpaGoalRepository = sankalpaGoalRepository;
    this.sessionLogRepository = sessionLogRepository;
  }

  public List<SankalpaProgressResponse> listSankalpas(String timeZoneRaw) {
    List<SessionLogEntity> sessionLogs = sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc();
    Instant now = Instant.now();
    ZoneId zoneId = parseZoneId(timeZoneRaw);

    return sankalpaGoalRepository.findAllByOrderByCreatedAtDesc()
        .stream()
        .map((goal) -> toProgressResponse(goal, sessionLogs, now, zoneId))
        .toList();
  }

  public SankalpaProgressResponse saveSankalpa(String sankalpaId, SankalpaGoalUpsertRequest request, String timeZoneRaw) {
    validateRequest(sankalpaId, request);

    Instant now = Instant.now();
    Instant createdAt = parseTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    SankalpaGoalEntity entity = sankalpaGoalRepository.findById(sankalpaId)
        .orElseGet(() -> new SankalpaGoalEntity(
            sankalpaId,
            request.goalType(),
            request.targetValue(),
            request.days(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            createdAt,
            null,
            request.archived()
        ));

    entity.updateFrom(
        new SankalpaGoalUpsertRequest(
            request.id(),
            request.goalType(),
            request.targetValue().stripTrailingZeros(),
            request.days(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            request.createdAt(),
            request.archived()
        ),
        createdAt
    );

    List<SessionLogEntity> sessionLogs = sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc();
    SankalpaProgressResponse progress = toProgressResponse(entity, sessionLogs, now, zoneId);
    entity.setCompletedAt("completed".equals(progress.status()) ? now : null);

    SankalpaGoalEntity savedEntity = sankalpaGoalRepository.save(entity);
    return toProgressResponse(savedEntity, sessionLogs, now, zoneId);
  }

  private SankalpaProgressResponse toProgressResponse(
      SankalpaGoalEntity goal,
      List<SessionLogEntity> sessionLogs,
      Instant now,
      ZoneId zoneId
  ) {
    List<SessionLogEntity> matchingSessionLogs = sessionLogs.stream()
        .filter((sessionLog) -> sessionLogInGoalWindow(sessionLog, goal) && sessionLogMatchesFilters(sessionLog, goal, zoneId))
        .toList();
    int matchedSessionCount = matchingSessionLogs.size();
    int matchedDurationSeconds = matchingSessionLogs.stream().mapToInt(SessionLogEntity::getCompletedDurationSeconds).sum();
    int targetDurationSeconds = "duration-based".equals(goal.getGoalType())
        ? goal.getTargetValue().multiply(BigDecimal.valueOf(60)).setScale(0, java.math.RoundingMode.HALF_UP).intValueExact()
        : 0;
    int targetSessionCount = "session-count-based".equals(goal.getGoalType()) ? goal.getTargetValue().intValueExact() : 0;
    int targetValue = "duration-based".equals(goal.getGoalType()) ? targetDurationSeconds : targetSessionCount;
    int progressValue = "duration-based".equals(goal.getGoalType()) ? matchedDurationSeconds : matchedSessionCount;
    Instant deadlineAt = goal.getCreatedAt().plusSeconds(goal.getDays() * DAY_SECONDS);

    String status;
    if (goal.isArchived()) {
      status = "archived";
    } else if (progressValue >= targetValue) {
      status = "completed";
    } else if (now.isAfter(deadlineAt)) {
      status = "expired";
    } else {
      status = "active";
    }

    return new SankalpaProgressResponse(
        toGoalResponse(goal),
        status,
        deadlineAt.toString(),
        matchedSessionCount,
        matchedDurationSeconds,
        targetSessionCount,
        targetDurationSeconds,
        targetValue == 0 ? 0 : Math.min((double) progressValue / targetValue, 1.0)
    );
  }

  private SankalpaGoalResponse toGoalResponse(SankalpaGoalEntity entity) {
    return new SankalpaGoalResponse(
        entity.getId(),
        entity.getGoalType(),
        entity.getTargetValue().doubleValue(),
        entity.getDays(),
        entity.getMeditationTypeCode(),
        entity.getTimeOfDayBucket(),
        entity.getCreatedAt().toString(),
        entity.isArchived()
    );
  }

  private boolean sessionLogInGoalWindow(SessionLogEntity sessionLog, SankalpaGoalEntity goal) {
    Instant deadlineAt = goal.getCreatedAt().plusSeconds(goal.getDays() * DAY_SECONDS);
    return !sessionLog.getEndedAt().isBefore(goal.getCreatedAt()) && !sessionLog.getEndedAt().isAfter(deadlineAt);
  }

  private boolean sessionLogMatchesFilters(SessionLogEntity sessionLog, SankalpaGoalEntity goal, ZoneId zoneId) {
    if (goal.getMeditationTypeCode() != null && !goal.getMeditationTypeCode().equals(sessionLog.getMeditationTypeCode())) {
      return false;
    }

    return goal.getTimeOfDayBucket() == null || goal.getTimeOfDayBucket().equals(getTimeOfDayBucket(sessionLog, zoneId));
  }

  private String getTimeOfDayBucket(SessionLogEntity sessionLog, ZoneId zoneId) {
    int hour = sessionLog.getEndedAt().atZone(zoneId).getHour();
    if (hour >= 5 && hour < 12) {
      return "morning";
    }
    if (hour >= 12 && hour < 17) {
      return "afternoon";
    }
    if (hour >= 17 && hour < 21) {
      return "evening";
    }
    return "night";
  }

  private ZoneId parseZoneId(String value) {
    if (value == null || value.isBlank()) {
      return ZoneId.systemDefault();
    }

    try {
      return ZoneId.of(value);
    } catch (DateTimeException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time zone must be a valid IANA zone.");
    }
  }

  private void validateRequest(String sankalpaId, SankalpaGoalUpsertRequest request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa request is required.");
    }

    if (request.id() == null || request.id().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa id is required.");
    }

    if (!request.id().equals(sankalpaId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa id must match the route id.");
    }

    if (!GOAL_TYPES.contains(request.goalType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa goal type is invalid.");
    }

    if (request.targetValue() == null || request.targetValue().compareTo(BigDecimal.ZERO) <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target value must be greater than 0.");
    }

    if ("session-count-based".equals(request.goalType())
        && request.targetValue().stripTrailingZeros().scale() > 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target session logs must be a whole number.");
    }

    if (request.days() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be greater than 0.");
    }

    if (request.meditationType() != null
        && !request.meditationType().isBlank()
        && !MEDITATION_TYPES.contains(request.meditationType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (request.timeOfDayBucket() != null
        && !request.timeOfDayBucket().isBlank()
        && !TIME_OF_DAY_BUCKETS.contains(request.timeOfDayBucket())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time-of-day bucket is invalid.");
    }

    parseTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");
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

  private String normalizeOptionalText(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value;
  }
}
