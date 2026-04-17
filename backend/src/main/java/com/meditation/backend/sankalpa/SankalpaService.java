package com.meditation.backend.sankalpa;

import com.meditation.backend.reference.ReferenceData;
import com.meditation.backend.sessionlog.SessionLogRepository;
import com.meditation.backend.sync.GeneratedSyncContract;
import com.meditation.backend.sync.SyncMutationResult;
import com.meditation.backend.sync.SyncRequestSupport;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SankalpaService {

  private static final long DAY_SECONDS = 24L * 60L * 60L;
  private static final int DAYS_PER_WEEK = 7;

  private final SankalpaGoalRepository sankalpaGoalRepository;
  private final SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository;
  private final SessionLogRepository sessionLogRepository;

  public SankalpaService(
      SankalpaGoalRepository sankalpaGoalRepository,
      SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository,
      SessionLogRepository sessionLogRepository
  ) {
    this.sankalpaGoalRepository = sankalpaGoalRepository;
    this.sankalpaObservanceEntryRepository = sankalpaObservanceEntryRepository;
    this.sessionLogRepository = sessionLogRepository;
  }

  public List<SankalpaProgressResponse> listSankalpas(String timeZoneRaw) {
    Instant now = Instant.now();
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    List<SankalpaGoalEntity> goals = sankalpaGoalRepository.findAllByOrderByCreatedAtDesc();
    Map<String, List<SankalpaObservanceEntryEntity>> observanceEntriesByGoalId = loadObservanceEntries(goals);

    return goals.stream()
        .map((goal) -> toProgressResponse(goal, observanceEntriesByGoalId.getOrDefault(goal.getId(), List.of()), now, zoneId))
        .toList();
  }

  @Transactional
  public SyncMutationResult<SankalpaProgressResponse> saveSankalpa(
      String sankalpaId,
      SankalpaGoalUpsertRequest request,
      String timeZoneRaw,
      String syncQueuedAtRaw
  ) {
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    validateRequest(sankalpaId, request, zoneId);

    Instant now = Instant.now();
    SankalpaGoalEntity existingEntity = sankalpaGoalRepository.findById(sankalpaId).orElse(null);
    if (existingEntity != null && SyncRequestSupport.isStaleMutation(existingEntity.getUpdatedAt(), syncQueuedAtRaw)) {
      List<SankalpaObservanceEntryEntity> staleEntries =
          sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(sankalpaId));
      return new SyncMutationResult<>(
          GeneratedSyncContract.SYNC_OUTCOME_STALE,
          toProgressResponse(existingEntity, staleEntries, now, zoneId)
      );
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
            request.qualifyingDaysPerWeek(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            normalizeOptionalText(request.observanceLabel()),
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
            request.qualifyingDaysPerWeek(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            normalizeOptionalText(request.observanceLabel()),
            normalizeObservanceRecordPayloads(request.observanceRecords()),
            request.createdAt(),
            request.archived()
        ),
        existingEntity == null ? createdAt : existingEntity.getCreatedAt(),
        mutationTimestamp
    );

    SankalpaGoalEntity savedEntity = sankalpaGoalRepository.save(entity);
    replaceObservanceEntries(savedEntity.getId(), request.observanceRecords(), mutationTimestamp);
    List<SankalpaObservanceEntryEntity> savedEntries =
        sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(savedEntity.getId()));

    SankalpaProgressResponse progress = toProgressResponse(savedEntity, savedEntries, now, zoneId);
    savedEntity.setCompletedAt("completed".equals(progress.status()) ? now : null);
    SankalpaGoalEntity completedStateEntity = sankalpaGoalRepository.save(savedEntity);
    return new SyncMutationResult<>(
        GeneratedSyncContract.SYNC_OUTCOME_APPLIED,
        toProgressResponse(completedStateEntity, savedEntries, now, zoneId)
    );
  }

  @Transactional
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
      List<SankalpaObservanceEntryEntity> staleEntries =
          sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(sankalpaId));
      return new SankalpaDeleteResult("stale", toProgressResponse(existingEntity, staleEntries, now, zoneId));
    }

    sankalpaObservanceEntryRepository.deleteAllBySankalpaId(sankalpaId);
    sankalpaGoalRepository.deleteById(sankalpaId);
    return new SankalpaDeleteResult("deleted", null);
  }

  private Map<String, List<SankalpaObservanceEntryEntity>> loadObservanceEntries(List<SankalpaGoalEntity> goals) {
    if (goals.isEmpty()) {
      return Collections.emptyMap();
    }

    return sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(
            goals.stream().map(SankalpaGoalEntity::getId).toList()
        )
        .stream()
        .collect(Collectors.groupingBy(SankalpaObservanceEntryEntity::getSankalpaId, LinkedHashMap::new, Collectors.toList()));
  }

  private void replaceObservanceEntries(
      String sankalpaId,
      List<SankalpaObservanceRecordPayload> observanceRecords,
      Instant mutationTimestamp
  ) {
    sankalpaObservanceEntryRepository.deleteAllBySankalpaId(sankalpaId);

    List<SankalpaObservanceRecordPayload> normalizedRecords = normalizeObservanceRecordPayloads(observanceRecords);
    if (normalizedRecords.isEmpty()) {
      return;
    }

    sankalpaObservanceEntryRepository.saveAll(
        normalizedRecords.stream()
            .map((record) -> new SankalpaObservanceEntryEntity(
                sankalpaId,
                LocalDate.parse(record.date()),
                record.status(),
                mutationTimestamp
            ))
            .toList()
    );
  }

  private SankalpaProgressResponse toProgressResponse(
      SankalpaGoalEntity goal,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      Instant now,
      ZoneId zoneId
  ) {
    SankalpaMatchTotals matchTotals = loadMatchTotals(goal, observanceEntries, zoneId);
    boolean recurringCadenceGoal = isRecurringCadenceGoal(goal);
    int matchedSessionCount = matchTotals.matchedSessionCount();
    int matchedDurationSeconds = matchTotals.matchedDurationSeconds();
    int targetDurationSeconds = "duration-based".equals(goal.getGoalType()) && !recurringCadenceGoal
        ? goal.getTargetValue().multiply(BigDecimal.valueOf(60)).setScale(0, RoundingMode.HALF_UP).intValueExact()
        : 0;
    int targetSessionCount = "session-count-based".equals(goal.getGoalType()) && !recurringCadenceGoal ? goal.getTargetValue().intValueExact() : 0;
    int targetObservanceCount = "observance-based".equals(goal.getGoalType()) ? goal.getTargetValue().intValueExact() : 0;
    int targetValue = "duration-based".equals(goal.getGoalType())
        ? recurringCadenceGoal ? matchTotals.targetRecurringWeekCount() : targetDurationSeconds
        : "session-count-based".equals(goal.getGoalType())
          ? recurringCadenceGoal ? matchTotals.targetRecurringWeekCount() : targetSessionCount
          : targetObservanceCount;
    int progressValue = "duration-based".equals(goal.getGoalType())
        ? recurringCadenceGoal ? matchTotals.metRecurringWeekCount() : matchedDurationSeconds
        : "session-count-based".equals(goal.getGoalType())
          ? recurringCadenceGoal ? matchTotals.metRecurringWeekCount() : matchedSessionCount
          : matchTotals.matchedObservanceCount();
    Instant deadlineAt = "observance-based".equals(goal.getGoalType())
        ? deriveObservanceDeadline(goal, zoneId)
        : recurringCadenceGoal
          ? deriveRecurringGoalDeadline(goal, zoneId)
          : goal.getCreatedAt().plusSeconds(goal.getDays() * DAY_SECONDS);

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
        toGoalResponse(goal, observanceEntries),
        status,
        deadlineAt.toString(),
        matchedSessionCount,
        matchedDurationSeconds,
        targetSessionCount,
        targetDurationSeconds,
        matchTotals.metRecurringWeekCount(),
        matchTotals.targetRecurringWeekCount(),
        matchTotals.recurringWeeks(),
        matchTotals.matchedObservanceCount(),
        matchTotals.missedObservanceCount(),
        matchTotals.pendingObservanceCount(),
        targetObservanceCount,
        matchTotals.observanceDays(),
        targetValue == 0 ? 0 : Math.min((double) progressValue / targetValue, 1.0)
    );
  }

  private SankalpaGoalResponse toGoalResponse(
      SankalpaGoalEntity entity,
      List<SankalpaObservanceEntryEntity> observanceEntries
  ) {
    return new SankalpaGoalResponse(
        entity.getId(),
        entity.getGoalType(),
        entity.getTargetValue().doubleValue(),
        entity.getDays(),
        entity.getQualifyingDaysPerWeek(),
        entity.getMeditationTypeCode(),
        entity.getTimeOfDayBucket(),
        entity.getObservanceLabel(),
        observanceEntries.stream()
            .map((entry) -> new SankalpaObservanceRecordPayload(entry.getObservanceDate().toString(), entry.getStatus()))
            .toList(),
        entity.getCreatedAt().toString(),
        entity.isArchived()
    );
  }

  private SankalpaMatchTotals loadMatchTotals(
      SankalpaGoalEntity goal,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      ZoneId zoneId
  ) {
    if ("observance-based".equals(goal.getGoalType())) {
      return loadObservanceMatchTotals(goal, observanceEntries, zoneId);
    }

    Instant startAt = goal.getCreatedAt();
    Instant deadlineAt = isRecurringCadenceGoal(goal)
        ? deriveRecurringGoalDeadline(goal, zoneId)
        : goal.getCreatedAt().plusSeconds(goal.getDays() * DAY_SECONDS);
    String meditationType = goal.getMeditationTypeCode();

    List<SessionLogRepository.SessionLogTimeSliceView> matchingSlices = loadMatchingTimeSlices(goal, startAt, deadlineAt, meditationType, zoneId);
    int matchedSessionCount = matchingSlices.size();
    int matchedDurationSeconds = matchingSlices.stream()
        .mapToInt(SessionLogRepository.SessionLogTimeSliceView::getCompletedDurationSeconds)
        .sum();

    if (!isRecurringCadenceGoal(goal)) {
      return new SankalpaMatchTotals(matchedSessionCount, matchedDurationSeconds, 0, 0, 0, List.of(), 0, 0, List.of());
    }

    return loadRecurringCadenceMatchTotals(goal, matchingSlices, zoneId, matchedSessionCount, matchedDurationSeconds);
  }

  private SankalpaMatchTotals loadObservanceMatchTotals(
      SankalpaGoalEntity goal,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      ZoneId zoneId
  ) {
    Map<LocalDate, String> statusByDate = observanceEntries.stream()
        .collect(Collectors.toMap(
            SankalpaObservanceEntryEntity::getObservanceDate,
            SankalpaObservanceEntryEntity::getStatus,
            (left, right) -> right,
            LinkedHashMap::new
        ));

    LocalDate startDate = goal.getCreatedAt().atZone(zoneId).toLocalDate();
    LocalDate today = Instant.now().atZone(zoneId).toLocalDate();
    int matchedObservanceCount = 0;
    int missedObservanceCount = 0;
    int pendingObservanceCount = 0;
    List<SankalpaObservanceDayResponse> observanceDays = new java.util.ArrayList<>();
    for (int index = 0; index < goal.getDays(); index += 1) {
      LocalDate date = startDate.plusDays(index);
      String savedStatus = statusByDate.get(date);
      String status = savedStatus == null ? "pending" : savedStatus;
      if (Objects.equals(status, "observed")) {
        matchedObservanceCount += 1;
      } else if (Objects.equals(status, "missed")) {
        missedObservanceCount += 1;
      } else {
        pendingObservanceCount += 1;
      }

      observanceDays.add(new SankalpaObservanceDayResponse(
          date.toString(),
          status,
          date.isAfter(today)
      ));
    }

    return new SankalpaMatchTotals(
        0,
        0,
        matchedObservanceCount,
        missedObservanceCount,
        pendingObservanceCount,
        observanceDays,
        0,
        0,
        List.of()
    );
  }

  private Instant deriveObservanceDeadline(SankalpaGoalEntity goal, ZoneId zoneId) {
    LocalDate startDate = goal.getCreatedAt().atZone(zoneId).toLocalDate();
    return startDate.plusDays(Math.max(0, goal.getDays() - 1)).atTime(LocalTime.MAX).atZone(zoneId).toInstant();
  }

  private Instant deriveRecurringGoalDeadline(SankalpaGoalEntity goal, ZoneId zoneId) {
    LocalDate startDate = goal.getCreatedAt().atZone(zoneId).toLocalDate();
    return startDate.plusDays(Math.max(0, goal.getDays() - 1)).atTime(LocalTime.MAX).atZone(zoneId).toInstant();
  }

  private boolean isRecurringCadenceGoal(SankalpaGoalEntity goal) {
    return !"observance-based".equals(goal.getGoalType()) && goal.getQualifyingDaysPerWeek() != null;
  }

  private List<SessionLogRepository.SessionLogTimeSliceView> loadMatchingTimeSlices(
      SankalpaGoalEntity goal,
      Instant startAt,
      Instant deadlineAt,
      String meditationType,
      ZoneId zoneId
  ) {
    if (goal.getTimeOfDayBucket() == null) {
      return sessionLogRepository.findTimeSlices(startAt, deadlineAt, meditationType, null);
    }

    return sessionLogRepository.findTimeSlices(startAt, deadlineAt, meditationType, null).stream()
        .filter((entry) -> goal.getTimeOfDayBucket().equals(ReferenceData.resolveTimeOfDayBucket(entry.getEndedAt(), zoneId)))
        .toList();
  }

  private SankalpaMatchTotals loadRecurringCadenceMatchTotals(
      SankalpaGoalEntity goal,
      List<SessionLogRepository.SessionLogTimeSliceView> matchingSlices,
      ZoneId zoneId,
      int matchedSessionCount,
      int matchedDurationSeconds
  ) {
    Map<LocalDate, Integer> dailyValueByDate = new LinkedHashMap<>();
    for (SessionLogRepository.SessionLogTimeSliceView entry : matchingSlices) {
      LocalDate localDate = entry.getEndedAt().atZone(zoneId).toLocalDate();
      int increment = "duration-based".equals(goal.getGoalType()) ? entry.getCompletedDurationSeconds() : 1;
      dailyValueByDate.merge(localDate, increment, Integer::sum);
    }

    LocalDate startDate = goal.getCreatedAt().atZone(zoneId).toLocalDate();
    LocalDate today = Instant.now().atZone(zoneId).toLocalDate();
    int targetRecurringWeekCount = Math.max(1, goal.getDays() / DAYS_PER_WEEK);
    int threshold = "duration-based".equals(goal.getGoalType())
        ? goal.getTargetValue().multiply(BigDecimal.valueOf(60)).setScale(0, RoundingMode.HALF_UP).intValueExact()
        : goal.getTargetValue().intValueExact();
    int metRecurringWeekCount = 0;
    List<SankalpaRecurringWeekResponse> recurringWeeks = new java.util.ArrayList<>();

    for (int weekIndex = 0; weekIndex < targetRecurringWeekCount; weekIndex += 1) {
      LocalDate weekStart = startDate.plusDays((long) weekIndex * DAYS_PER_WEEK);
      LocalDate weekEnd = weekStart.plusDays(DAYS_PER_WEEK - 1L);
      int qualifyingDayCount = 0;

      for (int dayOffset = 0; dayOffset < DAYS_PER_WEEK; dayOffset += 1) {
        LocalDate currentDate = weekStart.plusDays(dayOffset);
        int dailyValue = dailyValueByDate.getOrDefault(currentDate, 0);
        if (dailyValue >= threshold) {
          qualifyingDayCount += 1;
        }
      }

      String status;
      if (qualifyingDayCount >= goal.getQualifyingDaysPerWeek()) {
        status = "met";
        metRecurringWeekCount += 1;
      } else if (today.isAfter(weekEnd)) {
        status = "missed";
      } else if (today.isBefore(weekStart)) {
        status = "upcoming";
      } else {
        status = "active";
      }

      recurringWeeks.add(new SankalpaRecurringWeekResponse(
          weekIndex + 1,
          weekStart.toString(),
          weekEnd.toString(),
          qualifyingDayCount,
          goal.getQualifyingDaysPerWeek(),
          status
      ));
    }

    return new SankalpaMatchTotals(
        matchedSessionCount,
        matchedDurationSeconds,
        0,
        0,
        0,
        List.of(),
        metRecurringWeekCount,
        targetRecurringWeekCount,
        recurringWeeks
    );
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

  private void validateRequest(String sankalpaId, SankalpaGoalUpsertRequest request, ZoneId zoneId) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa request is required.");
    }

    if (request.id() == null || request.id().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa id is required.");
    }

    if (!request.id().equals(sankalpaId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa id must match the route id.");
    }

    if (!ReferenceData.isGoalType(request.goalType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sankalpa goal type is invalid.");
    }

    if (request.targetValue() == null || request.targetValue().compareTo(BigDecimal.ZERO) <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target value must be greater than 0.");
    }

    if (request.days() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be greater than 0.");
    }

    Instant createdAt = parseTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");

    if ("observance-based".equals(request.goalType())) {
      if (request.targetValue().stripTrailingZeros().scale() > 0 || request.targetValue().intValueExact() != request.days()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance goals must target all scheduled days.");
      }

      if (request.observanceLabel() == null || request.observanceLabel().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance label is required.");
      }

      if (request.meditationType() != null && !request.meditationType().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance goals cannot include a meditation type filter.");
      }

      if (request.timeOfDayBucket() != null && !request.timeOfDayBucket().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance goals cannot include a time-of-day filter.");
      }

      if (request.qualifyingDaysPerWeek() != null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance goals cannot include a weekly cadence target.");
      }

      validateObservanceRecords(request.observanceRecords(), createdAt, request.days(), zoneId);
      return;
    }

    if ("session-count-based".equals(request.goalType())
        && request.targetValue().stripTrailingZeros().scale() > 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target session logs must be a whole number.");
    }

    if (request.qualifyingDaysPerWeek() != null) {
      if (request.qualifyingDaysPerWeek() <= 0 || request.qualifyingDaysPerWeek() > DAYS_PER_WEEK) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Qualifying days per week must be between 1 and 7.");
      }

      if (request.days() % DAYS_PER_WEEK != 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weekly cadence goals must use a whole number of weeks.");
      }
    }

    if (request.meditationType() != null
        && !request.meditationType().isBlank()
        && !ReferenceData.isMeditationType(request.meditationType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (request.timeOfDayBucket() != null
        && !request.timeOfDayBucket().isBlank()
        && !ReferenceData.isTimeOfDayBucket(request.timeOfDayBucket())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time-of-day bucket is invalid.");
    }

    if (request.observanceLabel() != null && !request.observanceLabel().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only observance goals can include an observance label.");
    }

    if (request.observanceRecords() != null && !request.observanceRecords().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only observance goals can include observance records.");
    }
  }

  private void validateObservanceRecords(
      List<SankalpaObservanceRecordPayload> observanceRecords,
      Instant createdAt,
      int days,
      ZoneId zoneId
  ) {
    for (SankalpaObservanceRecordPayload record : normalizeObservanceRecordPayloads(observanceRecords)) {
      if (!ReferenceData.isObservanceStatus(record.status())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance status is invalid.");
      }

      LocalDate date;
      try {
        date = LocalDate.parse(record.date());
      } catch (DateTimeParseException exception) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance date must be a valid ISO date.");
      }

      LocalDate startDate = createdAt.atZone(zoneId).toLocalDate();
      LocalDate endDate = startDate.plusDays(Math.max(0, days - 1));
      if (date.isBefore(startDate) || date.isAfter(endDate)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance date must fall within the sankalpa window.");
      }
    }
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

  private List<SankalpaObservanceRecordPayload> normalizeObservanceRecordPayloads(
      List<SankalpaObservanceRecordPayload> observanceRecords
  ) {
    if (observanceRecords == null || observanceRecords.isEmpty()) {
      return List.of();
    }

    return observanceRecords.stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toMap(
            SankalpaObservanceRecordPayload::date,
            SankalpaObservanceRecordPayload::status,
            (left, right) -> right,
            LinkedHashMap::new
        ))
        .entrySet()
        .stream()
        .sorted(Map.Entry.comparingByKey())
        .map((entry) -> new SankalpaObservanceRecordPayload(entry.getKey(), entry.getValue()))
        .toList();
  }

  private record SankalpaMatchTotals(
      int matchedSessionCount,
      int matchedDurationSeconds,
      int matchedObservanceCount,
      int missedObservanceCount,
      int pendingObservanceCount,
      List<SankalpaObservanceDayResponse> observanceDays,
      int metRecurringWeekCount,
      int targetRecurringWeekCount,
      List<SankalpaRecurringWeekResponse> recurringWeeks
  ) {
  }
}
