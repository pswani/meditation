package com.meditation.backend.summary;

import com.meditation.backend.sessionlog.SessionLogEntity;
import com.meditation.backend.sessionlog.SessionLogRepository;
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
public class SummaryService {

  private static final List<String> MEDITATION_TYPES = List.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");
  private static final List<String> SUMMARY_SOURCES = List.of("auto log", "manual log");
  private static final List<String> TIME_OF_DAY_BUCKETS = List.of("morning", "afternoon", "evening", "night");
  private static final Set<String> COMPLETED_STATUS = Set.of("completed");

  private final SessionLogRepository sessionLogRepository;

  public SummaryService(SessionLogRepository sessionLogRepository) {
    this.sessionLogRepository = sessionLogRepository;
  }

  public SummaryResponse getSummary(String startAtRaw, String endAtRaw, String timeZoneRaw) {
    Instant startAt = parseOptionalInstant(startAtRaw, "Start at must be a valid ISO timestamp.");
    Instant endAt = parseOptionalInstant(endAtRaw, "End at must be a valid ISO timestamp.");
    ZoneId zoneId = parseZoneId(timeZoneRaw);

    if (startAt != null && endAt != null && startAt.isAfter(endAt)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start at must be on or before end at.");
    }

    List<SessionLogEntity> sessionLogs = loadSessionLogs(startAt, endAt);
    return new SummaryResponse(
        deriveOverallSummary(sessionLogs),
        deriveSummaryByType(sessionLogs),
        deriveSummaryBySource(sessionLogs),
        deriveSummaryByTimeOfDay(sessionLogs, zoneId)
    );
  }

  private List<SessionLogEntity> loadSessionLogs(Instant startAt, Instant endAt) {
    if (startAt != null && endAt != null) {
      return sessionLogRepository.findAllByEndedAtBetweenOrderByEndedAtDescCreatedAtDesc(startAt, endAt);
    }

    if (startAt != null) {
      return sessionLogRepository.findAllByEndedAtGreaterThanEqualOrderByEndedAtDescCreatedAtDesc(startAt);
    }

    if (endAt != null) {
      return sessionLogRepository.findAllByEndedAtLessThanEqualOrderByEndedAtDescCreatedAtDesc(endAt);
    }

    return sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc();
  }

  private SummaryOverallResponse deriveOverallSummary(List<SessionLogEntity> sessionLogs) {
    if (sessionLogs.isEmpty()) {
      return new SummaryOverallResponse(0, 0, 0, 0, 0, 0, 0);
    }

    int completedSessionLogs = (int) sessionLogs.stream().filter(this::isCompletedLog).count();
    int totalDurationSeconds = sessionLogs.stream().mapToInt(SessionLogEntity::getCompletedDurationSeconds).sum();
    int autoLogs = (int) sessionLogs.stream().filter((entry) -> "auto log".equals(entry.getSource())).count();

    return new SummaryOverallResponse(
        sessionLogs.size(),
        completedSessionLogs,
        sessionLogs.size() - completedSessionLogs,
        totalDurationSeconds,
        Math.round((float) totalDurationSeconds / sessionLogs.size()),
        autoLogs,
        sessionLogs.size() - autoLogs
    );
  }

  private List<SummaryByTypeResponse> deriveSummaryByType(List<SessionLogEntity> sessionLogs) {
    return MEDITATION_TYPES.stream()
        .map((meditationType) -> {
          List<SessionLogEntity> matchingLogs = sessionLogs.stream()
              .filter((entry) -> meditationType.equals(entry.getMeditationTypeCode()))
              .toList();

          return new SummaryByTypeResponse(
              meditationType,
              matchingLogs.size(),
              matchingLogs.stream().mapToInt(SessionLogEntity::getCompletedDurationSeconds).sum()
          );
        })
        .toList();
  }

  private List<SummaryBySourceResponse> deriveSummaryBySource(List<SessionLogEntity> sessionLogs) {
    return SUMMARY_SOURCES.stream()
        .map((source) -> {
          List<SessionLogEntity> matchingLogs = sessionLogs.stream()
              .filter((entry) -> source.equals(entry.getSource()))
              .toList();
          int completedSessionLogs = (int) matchingLogs.stream().filter(this::isCompletedLog).count();

          return new SummaryBySourceResponse(
              source,
              matchingLogs.size(),
              completedSessionLogs,
              matchingLogs.size() - completedSessionLogs,
              matchingLogs.stream().mapToInt(SessionLogEntity::getCompletedDurationSeconds).sum()
          );
        })
        .toList();
  }

  private List<SummaryByTimeOfDayResponse> deriveSummaryByTimeOfDay(List<SessionLogEntity> sessionLogs, ZoneId zoneId) {
    return TIME_OF_DAY_BUCKETS.stream()
        .map((bucket) -> {
          List<SessionLogEntity> matchingLogs = sessionLogs.stream()
              .filter((entry) -> bucket.equals(getTimeOfDayBucket(entry, zoneId)))
              .toList();
          int completedSessionLogs = (int) matchingLogs.stream().filter(this::isCompletedLog).count();

          return new SummaryByTimeOfDayResponse(
              bucket,
              matchingLogs.size(),
              completedSessionLogs,
              matchingLogs.size() - completedSessionLogs,
              matchingLogs.stream().mapToInt(SessionLogEntity::getCompletedDurationSeconds).sum()
          );
        })
        .toList();
  }

  private boolean isCompletedLog(SessionLogEntity sessionLog) {
    return COMPLETED_STATUS.contains(sessionLog.getStatus());
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

  private Instant parseOptionalInstant(String value, String errorMessage) {
    if (value == null || value.isBlank()) {
      return null;
    }

    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
    }
  }
}
