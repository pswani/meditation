package com.meditation.backend.sankalpa;

import com.meditation.backend.reference.ReferenceData;
import com.meditation.backend.sessionlog.SessionLogRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SankalpaProgressProjector {

  private final SessionLogRepository sessionLogRepository;

  public SankalpaProgressProjector(SessionLogRepository sessionLogRepository) {
    this.sessionLogRepository = sessionLogRepository;
  }

  public SankalpaProgressResponse project(
      SankalpaGoalEntity goal,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      Instant now,
      ZoneId zoneId
  ) {
    List<SessionLogRepository.SessionLogTimeSliceView> timeSlices = fetchTimeSlices(goal, zoneId);
    SankalpaCadencePolicy.SankalpaMatchTotals matchTotals =
        SankalpaCadencePolicy.computeMatchTotals(goal, timeSlices, observanceEntries, now, zoneId);

    boolean recurringCadenceGoal = SankalpaCadencePolicy.isRecurringCadenceGoal(goal);
    int matchedSessionCount = matchTotals.matchedSessionCount();
    int matchedDurationSeconds = matchTotals.matchedDurationSeconds();
    int targetDurationSeconds = "duration-based".equals(goal.getGoalType()) && !recurringCadenceGoal
        ? goal.getTargetValue().multiply(BigDecimal.valueOf(60)).setScale(0, RoundingMode.HALF_UP).intValueExact()
        : 0;
    int targetSessionCount = "session-count-based".equals(goal.getGoalType()) && !recurringCadenceGoal
        ? goal.getTargetValue().intValueExact() : 0;
    int targetObservanceCount = "observance-based".equals(goal.getGoalType())
        ? recurringCadenceGoal
          ? goal.getQualifyingDaysPerWeek() * matchTotals.targetRecurringWeekCount()
          : goal.getTargetValue().intValueExact()
        : 0;
    int targetValue = "duration-based".equals(goal.getGoalType())
        ? recurringCadenceGoal ? matchTotals.targetRecurringWeekCount() : targetDurationSeconds
        : "session-count-based".equals(goal.getGoalType())
          ? recurringCadenceGoal ? matchTotals.targetRecurringWeekCount() : targetSessionCount
          : recurringCadenceGoal ? matchTotals.targetRecurringWeekCount() : targetObservanceCount;
    int progressValue = "duration-based".equals(goal.getGoalType())
        ? recurringCadenceGoal ? matchTotals.metRecurringWeekCount() : matchedDurationSeconds
        : "session-count-based".equals(goal.getGoalType())
          ? recurringCadenceGoal ? matchTotals.metRecurringWeekCount() : matchedSessionCount
          : recurringCadenceGoal ? matchTotals.metRecurringWeekCount() : matchTotals.matchedObservanceCount();
    Instant deadlineAt = SankalpaCadencePolicy.deriveDeadline(goal, zoneId);

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
        targetValue == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(progressValue)
            .divide(BigDecimal.valueOf(targetValue), 4, RoundingMode.HALF_UP)
            .min(BigDecimal.ONE)
    );
  }

  private List<SessionLogRepository.SessionLogTimeSliceView> fetchTimeSlices(
      SankalpaGoalEntity goal,
      ZoneId zoneId
  ) {
    if ("observance-based".equals(goal.getGoalType())) {
      return List.of();
    }
    Instant startAt = goal.getCreatedAt();
    Instant deadlineAt = SankalpaCadencePolicy.deriveDeadline(goal, zoneId);
    String meditationType = goal.getMeditationTypeCode();
    if (goal.getTimeOfDayBucket() == null) {
      return sessionLogRepository.findTimeSlices(startAt, deadlineAt, meditationType, null);
    }
    return sessionLogRepository.findTimeSlices(startAt, deadlineAt, meditationType, null).stream()
        .filter(e -> goal.getTimeOfDayBucket().equals(ReferenceData.resolveTimeOfDayBucket(e.getEndedAt(), zoneId)))
        .toList();
  }

  private SankalpaGoalResponse toGoalResponse(
      SankalpaGoalEntity entity,
      List<SankalpaObservanceEntryEntity> observanceEntries
  ) {
    return new SankalpaGoalResponse(
        entity.getId(),
        entity.getTitle(),
        entity.getGoalType(),
        entity.getTargetValue().doubleValue(),
        entity.getDays(),
        entity.getQualifyingDaysPerWeek(),
        entity.getMeditationTypeCode(),
        entity.getTimeOfDayBucket(),
        entity.getObservanceLabel(),
        observanceEntries.stream()
            .map(e -> new SankalpaObservanceRecordPayload(e.getObservanceDate().toString(), e.getStatus()))
            .toList(),
        entity.getCreatedAt().toString(),
        entity.isArchived()
    );
  }
}
