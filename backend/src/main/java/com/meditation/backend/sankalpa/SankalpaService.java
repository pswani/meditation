package com.meditation.backend.sankalpa;

import com.meditation.backend.config.SyncProperties;
import com.meditation.backend.reference.ReferenceData;
import com.meditation.backend.sync.GeneratedSyncContract;
import com.meditation.backend.sync.SyncMutationResult;
import com.meditation.backend.sync.SyncRequestSupport;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SankalpaService {

  private static final int DAYS_PER_WEEK = 7;

  private final SankalpaGoalRepository sankalpaGoalRepository;
  private final SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository;
  private final SankalpaProgressProjector progressProjector;
  private final SankalpaObservanceRecalculator observanceRecalculator;
  private final Clock clock;
  private final SyncProperties syncProperties;

  public SankalpaService(
      SankalpaGoalRepository sankalpaGoalRepository,
      SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository,
      SankalpaProgressProjector progressProjector,
      SankalpaObservanceRecalculator observanceRecalculator,
      Clock clock,
      SyncProperties syncProperties
  ) {
    this.sankalpaGoalRepository = sankalpaGoalRepository;
    this.sankalpaObservanceEntryRepository = sankalpaObservanceEntryRepository;
    this.progressProjector = progressProjector;
    this.observanceRecalculator = observanceRecalculator;
    this.clock = clock;
    this.syncProperties = syncProperties;
  }

  public List<SankalpaProgressResponse> listSankalpas(String timeZoneRaw) {
    Instant now = clock.instant();
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    List<SankalpaGoalEntity> goals = sankalpaGoalRepository.findAllByOrderByCreatedAtDesc();
    if (goals.isEmpty()) {
      return List.of();
    }

    List<String> goalIds = goals.stream().map(SankalpaGoalEntity::getId).toList();
    List<SankalpaObservanceEntryEntity> allEntries =
        sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(goalIds);
    var entriesByGoalId = allEntries.stream()
        .collect(Collectors.groupingBy(SankalpaObservanceEntryEntity::getSankalpaId,
            LinkedHashMap::new, Collectors.toList()));

    return goals.stream()
        .map(goal -> progressProjector.project(
            goal,
            entriesByGoalId.getOrDefault(goal.getId(), List.of()),
            now,
            zoneId))
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

    Instant now = clock.instant();
    SankalpaGoalEntity existingEntity = sankalpaGoalRepository.findById(sankalpaId).orElse(null);
    if (existingEntity != null && SyncRequestSupport.isStaleMutation(existingEntity.getUpdatedAt(), syncQueuedAtRaw)) {
      List<SankalpaObservanceEntryEntity> staleEntries =
          sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(sankalpaId));
      return new SyncMutationResult<>(
          GeneratedSyncContract.SYNC_OUTCOME_STALE,
          progressProjector.project(existingEntity, staleEntries, now, zoneId)
      );
    }

    Instant mutationTimestamp = SyncRequestSupport.resolveMutationTimestamp(syncQueuedAtRaw, now);
    Instant createdAt = SyncRequestSupport.parseRequiredTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");
    if (existingEntity == null) {
      long skewSeconds = Math.abs(Duration.between(createdAt, now).getSeconds());
      if (skewSeconds > syncProperties.getClockSkewToleranceSeconds()) {
        createdAt = now;
      }
    }

    SankalpaGoalEntity entity = existingEntity != null
        ? existingEntity
        : new SankalpaGoalEntity(
            sankalpaId,
            normalizeOptionalText(request.title()),
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
            normalizeOptionalText(request.title()),
            request.goalType(),
            request.targetValue().setScale(2, java.math.RoundingMode.HALF_UP),
            request.days(),
            request.qualifyingDaysPerWeek(),
            normalizeOptionalText(request.meditationType()),
            normalizeOptionalText(request.timeOfDayBucket()),
            normalizeOptionalText(request.observanceLabel()),
            SankalpaObservanceRecalculator.normalizePayloads(request.observanceRecords()),
            request.createdAt(),
            request.archived()
        ),
        existingEntity == null ? createdAt : existingEntity.getCreatedAt(),
        mutationTimestamp
    );

    SankalpaGoalEntity savedEntity = sankalpaGoalRepository.save(entity);
    observanceRecalculator.replace(savedEntity.getId(), request.observanceRecords(), mutationTimestamp);
    List<SankalpaObservanceEntryEntity> savedEntries =
        sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(savedEntity.getId()));

    SankalpaProgressResponse progress = progressProjector.project(savedEntity, savedEntries, now, zoneId);
    savedEntity.setCompletedAt("completed".equals(progress.status()) ? now : null);
    SankalpaGoalEntity completedStateEntity = sankalpaGoalRepository.save(savedEntity);
    return new SyncMutationResult<>(
        GeneratedSyncContract.SYNC_OUTCOME_APPLIED,
        progressProjector.project(completedStateEntity, savedEntries, now, zoneId)
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

    Instant now = clock.instant();
    ZoneId zoneId = parseZoneId(timeZoneRaw);

    if (SyncRequestSupport.isStaleMutation(existingEntity.getUpdatedAt(), syncQueuedAtRaw)) {
      List<SankalpaObservanceEntryEntity> staleEntries =
          sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of(sankalpaId));
      return new SankalpaDeleteResult("stale", progressProjector.project(existingEntity, staleEntries, now, zoneId));
    }

    sankalpaObservanceEntryRepository.deleteAllBySankalpaId(sankalpaId);
    sankalpaGoalRepository.deleteById(sankalpaId);
    return new SankalpaDeleteResult("deleted", null);
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
    String title = normalizeOptionalText(request.title());
    if (title != null && title.length() > 160) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 160 characters or fewer.");
    }
    if (request.targetValue() == null || request.targetValue().compareTo(BigDecimal.ZERO) <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target value must be greater than 0.");
    }
    if (request.days() <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Days must be greater than 0.");
    }
    Instant createdAt = SyncRequestSupport.parseRequiredTimestamp(request.createdAt(), "Created at must be a valid ISO timestamp.");

    if ("observance-based".equals(request.goalType())) {
      if (request.targetValue().stripTrailingZeros().scale() > 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance target must be a whole number.");
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
      if (request.qualifyingDaysPerWeek() == null) {
        if (request.targetValue().intValueExact() != request.days()) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observance goals must target all scheduled days.");
        }
      } else {
        if (request.qualifyingDaysPerWeek() <= 0 || request.qualifyingDaysPerWeek() > DAYS_PER_WEEK) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observed days per week must be between 1 and 7.");
        }
        if (request.days() % DAYS_PER_WEEK != 0) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weekly observance goals must use a whole number of weeks.");
        }
        if (request.targetValue().intValueExact() != request.qualifyingDaysPerWeek()) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Weekly observance target must match observed days per week.");
        }
      }
      SankalpaObservanceRecalculator.validateRecords(request.observanceRecords(), createdAt, request.days(), zoneId);
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

  private String normalizeOptionalText(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }
}
