package com.meditation.backend.sankalpa;

import com.meditation.backend.sessionlog.SessionLogRepository;
import com.meditation.backend.sync.SyncRequestSupport;
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
    Instant now = Instant.now();
    ZoneId zoneId = parseZoneId(timeZoneRaw);

    return sankalpaGoalRepository.findAllByOrderByCreatedAtDesc()
        .stream()
        .map((goal) -> toProgressResponse(goal, now, zoneId))
        .toList();
  }

  public SankalpaProgressResponse saveSankalpa(
      String sankalpaId,
      SankalpaGoalUpsertRequest request,
      String timeZoneRaw,
      String syncQueuedAtRaw
  ) {
    validateRequest(sankalpaId, request);

    Instant now = Instant.now();
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    SankalpaGoalEntity existingEntity = sankalpaGoalRepository.findById(sankalpaId).orElse(null);
    if (existingEntity != null && SyncRequestSupport.isStaleMutation(existingEntity.getUpdatedAt(), syncQueuedAtRaw)) {
      return toProgressResponse(existingEntity, now, zoneId);
    }

    Instant mutationTimestamp = SyncRequestSupport.resolveMutationTimestamp(syncQueuedAtRaw, now);
    Instant createdAt = parseTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");
    SankalpaGoalEntity entity = existingEntity != null
        ? existingEntity
        : new SankalpaGoalEntity(
            sankalpaId,
            request.goalType(),
            request.targetValue(),
            request.days(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            createdAt,
            mutationTimestamp,
            null,
            request.archived()
        );

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
        existingEntity == null ? createdAt : existingEntity.getCreatedAt(),
        mutationTimestamp
    );

    SankalpaProgressResponse progress = toProgressResponse(entity, now, zoneId);
    entity.setCompletedAt("completed".equals(progress.status()) ? now : null);

    SankalpaGoalEntity savedEntity = sankalpaGoalRepository.save(entity);
    return toProgressResponse(savedEntity, now, zoneId);
  }

  public SankalpaDeleteResult deleteSankalpa(String sankalpaId, String timeZoneRaw, String syncQueuedAtRaw) {
    SankalpaGoalEntity existingEntity = sankalpaGoalRepository.findById(sankalpaId).orElse(null);
    if (existingEntity == null) {
      return new SankalpaDeleteResult("deleted", null);
    }

    if (!existingEntity.isArchived()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Only archived sankalpas can be deleted.");
    }

    Instant now = Instant.now();
    ZoneId zoneId = parseZoneId(timeZoneRaw);

    if (SyncRequestSupport.isStaleMutation(existingEntity.getUpdatedAt(), syncQueuedAtRaw)) {
      return new SankalpaDeleteResult("stale", toProgressResponse(existingEntity, now, zoneId));
    }

    sankalpaGoalRepository.deleteById(sankalpaId);
    return new SankalpaDeleteResult("deleted", null);
  }

  private SankalpaProgressResponse toProgressResponse(
      SankalpaGoalEntity goal,
      Instant now,
      ZoneId zoneId
  ) {
    SankalpaMatchTotals matchTotals = loadMatchTotals(goal, zoneId);
    int matchedSessionCount = matchTotals.matchedSessionCount();
    int matchedDurationSeconds = matchTotals.matchedDurationSeconds();
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

  private SankalpaMatchTotals loadMatchTotals(SankalpaGoalEntity goal, ZoneId zoneId) {
    Instant startAt = goal.getCreatedAt();
    Instant deadlineAt = goal.getCreatedAt().plusSeconds(goal.getDays() * DAY_SECONDS);
    String meditationType = goal.getMeditationTypeCode();

    if (goal.getTimeOfDayBucket() == null) {
      SessionLogRepository.SessionLogAggregateView aggregate = sessionLogRepository.summarizeForGoalWindow(startAt, deadlineAt, meditationType);
      return new SankalpaMatchTotals(
          Math.toIntExact(aggregate.getSessionLogCount()),
          Math.toIntExact(aggregate.getTotalDurationSeconds())
      );
    }

    int matchedSessionCount = 0;
    int matchedDurationSeconds = 0;
    for (SessionLogRepository.SessionLogTimeSliceView entry : sessionLogRepository.findTimeSlices(startAt, deadlineAt, meditationType, null)) {
      if (!goal.getTimeOfDayBucket().equals(getTimeOfDayBucket(entry.getEndedAt(), zoneId))) {
        continue;
      }
      matchedSessionCount += 1;
      matchedDurationSeconds += entry.getCompletedDurationSeconds();
    }

    return new SankalpaMatchTotals(matchedSessionCount, matchedDurationSeconds);
  }

  private String getTimeOfDayBucket(Instant endedAt, ZoneId zoneId) {
    int hour = endedAt.atZone(zoneId).getHour();
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

    return value.trim();
  }

  private record SankalpaMatchTotals(int matchedSessionCount, int matchedDurationSeconds) {
  }
}
