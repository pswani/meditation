package com.meditation.backend.sankalpa;

import com.meditation.backend.sessionlog.SessionLogRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

public final class SankalpaCadencePolicy {

  private static final int DAYS_PER_WEEK = 7;

  private SankalpaCadencePolicy() {
  }

  public static boolean isRecurringCadenceGoal(SankalpaGoalEntity goal) {
    return goal.getQualifyingDaysPerWeek() != null;
  }

  public static Instant deriveDeadline(SankalpaGoalEntity goal, ZoneId zoneId) {
    LocalDate startDate = goal.getCreatedAt().atZone(zoneId).toLocalDate();
    return startDate.plusDays(Math.max(0, goal.getDays() - 1)).atTime(LocalTime.MAX).atZone(zoneId).toInstant();
  }

  public static SankalpaMatchTotals computeMatchTotals(
      SankalpaGoalEntity goal,
      List<SessionLogRepository.SessionLogTimeSliceView> timeSlices,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      Instant now,
      ZoneId zoneId
  ) {
    if ("observance-based".equals(goal.getGoalType())) {
      return computeObservanceMatchTotals(goal, observanceEntries, now, zoneId);
    }

    int matchedSessionCount = timeSlices.size();
    int matchedDurationSeconds = timeSlices.stream()
        .mapToInt(SessionLogRepository.SessionLogTimeSliceView::getCompletedDurationSeconds)
        .sum();

    if (!isRecurringCadenceGoal(goal)) {
      return new SankalpaMatchTotals(matchedSessionCount, matchedDurationSeconds, 0, 0, 0, List.of(), 0, 0, List.of());
    }

    return computeRecurringCadenceMatchTotals(goal, timeSlices, now, zoneId, matchedSessionCount, matchedDurationSeconds);
  }

  private static SankalpaMatchTotals computeObservanceMatchTotals(
      SankalpaGoalEntity goal,
      List<SankalpaObservanceEntryEntity> observanceEntries,
      Instant now,
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
    LocalDate today = now.atZone(zoneId).toLocalDate();
    int matchedObservanceCount = 0;
    int missedObservanceCount = 0;
    int pendingObservanceCount = 0;
    List<SankalpaObservanceDayResponse> observanceDays = new ArrayList<>();
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
      observanceDays.add(new SankalpaObservanceDayResponse(date.toString(), status, date.isAfter(today)));
    }

    int metRecurringWeekCount = 0;
    int targetRecurringWeekCount =
        goal.getQualifyingDaysPerWeek() == null ? 0 : Math.max(1, goal.getDays() / DAYS_PER_WEEK);
    List<SankalpaRecurringWeekResponse> recurringWeeks = new ArrayList<>();

    if (goal.getQualifyingDaysPerWeek() != null) {
      for (int weekIndex = 0; weekIndex < targetRecurringWeekCount; weekIndex += 1) {
        LocalDate weekStart = startDate.plusDays((long) weekIndex * DAYS_PER_WEEK);
        LocalDate weekEnd = weekStart.plusDays(DAYS_PER_WEEK - 1L);
        int qualifyingDayCount = 0;
        for (int dayOffset = 0; dayOffset < DAYS_PER_WEEK; dayOffset += 1) {
          LocalDate currentDate = weekStart.plusDays(dayOffset);
          if (Objects.equals(statusByDate.get(currentDate), "observed")) {
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
            weekIndex + 1, weekStart.toString(), weekEnd.toString(),
            qualifyingDayCount, goal.getQualifyingDaysPerWeek(), status));
      }
    }

    return new SankalpaMatchTotals(0, 0, matchedObservanceCount, missedObservanceCount,
        pendingObservanceCount, observanceDays, metRecurringWeekCount, targetRecurringWeekCount, recurringWeeks);
  }

  private static SankalpaMatchTotals computeRecurringCadenceMatchTotals(
      SankalpaGoalEntity goal,
      List<SessionLogRepository.SessionLogTimeSliceView> matchingSlices,
      Instant now,
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
    LocalDate today = now.atZone(zoneId).toLocalDate();
    int targetRecurringWeekCount = Math.max(1, goal.getDays() / DAYS_PER_WEEK);
    int threshold = "duration-based".equals(goal.getGoalType())
        ? goal.getTargetValue().multiply(BigDecimal.valueOf(60)).setScale(0, RoundingMode.HALF_UP).intValueExact()
        : goal.getTargetValue().intValueExact();
    int metRecurringWeekCount = 0;
    List<SankalpaRecurringWeekResponse> recurringWeeks = new ArrayList<>();

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
          weekIndex + 1, weekStart.toString(), weekEnd.toString(),
          qualifyingDayCount, goal.getQualifyingDaysPerWeek(), status));
    }

    return new SankalpaMatchTotals(matchedSessionCount, matchedDurationSeconds, 0, 0, 0,
        List.of(), metRecurringWeekCount, targetRecurringWeekCount, recurringWeeks);
  }

  public record SankalpaMatchTotals(
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
