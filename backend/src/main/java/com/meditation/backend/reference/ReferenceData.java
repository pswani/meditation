package com.meditation.backend.reference;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

public final class ReferenceData {

  public static final List<String> MEDITATION_TYPES = List.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");
  public static final List<String> SESSION_LOG_SOURCES = List.of("auto log", "manual log");
  public static final List<String> TIME_OF_DAY_BUCKETS = List.of("morning", "afternoon", "evening", "night");

  private static final Set<String> MEDITATION_TYPE_SET = Set.copyOf(MEDITATION_TYPES);
  private static final Set<String> SESSION_LOG_SOURCE_SET = Set.copyOf(SESSION_LOG_SOURCES);
  private static final Set<String> TIME_OF_DAY_BUCKET_SET = Set.copyOf(TIME_OF_DAY_BUCKETS);
  private static final Set<String> GOAL_TYPE_SET = Set.of("duration-based", "session-count-based");
  private static final Set<String> TIMER_MODE_SET = Set.of("fixed", "open-ended");
  private static final Set<String> SESSION_LOG_STATUS_SET = Set.of("completed", "ended early");
  private static final Set<String> COMPLETED_SESSION_LOG_STATUS_SET = Set.of("completed");

  private ReferenceData() {
  }

  public static boolean isMeditationType(String value) {
    return value != null && MEDITATION_TYPE_SET.contains(value);
  }

  public static boolean isSessionLogSource(String value) {
    return value != null && SESSION_LOG_SOURCE_SET.contains(value);
  }

  public static boolean isTimeOfDayBucket(String value) {
    return value != null && TIME_OF_DAY_BUCKET_SET.contains(value);
  }

  public static boolean isGoalType(String value) {
    return value != null && GOAL_TYPE_SET.contains(value);
  }

  public static boolean isTimerMode(String value) {
    return value != null && TIMER_MODE_SET.contains(value);
  }

  public static boolean isSessionLogStatus(String value) {
    return value != null && SESSION_LOG_STATUS_SET.contains(value);
  }

  public static boolean isCompletedSessionLogStatus(String value) {
    return value != null && COMPLETED_SESSION_LOG_STATUS_SET.contains(value);
  }

  public static String resolveTimeOfDayBucket(Instant endedAt, ZoneId zoneId) {
    return resolveTimeOfDayBucketForHour(endedAt.atZone(zoneId).getHour());
  }

  public static String resolveTimeOfDayBucketForHour(int hour) {
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
}
