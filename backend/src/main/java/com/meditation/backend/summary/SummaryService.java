package com.meditation.backend.summary;

import com.meditation.backend.sessionlog.SessionLogRepository;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

  public SummaryResponse getSummary(
      String startAtRaw,
      String endAtRaw,
      String timeZoneRaw,
      String meditationTypeRaw,
      String sourceRaw
  ) {
    SummaryFilters filters = parseFilters(startAtRaw, endAtRaw, timeZoneRaw, meditationTypeRaw, sourceRaw);

    return new SummaryResponse(
        deriveOverallSummary(filters),
        deriveSummaryByType(filters),
        deriveSummaryBySource(filters),
        deriveSummaryByTimeOfDay(filters)
    );
  }

  private SummaryOverallResponse deriveOverallSummary(SummaryFilters filters) {
    SessionLogRepository.SummaryOverallView summary = sessionLogRepository.summarizeOverall(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source()
    );
    int totalSessionLogs = toIntCount(summary.getTotalSessionLogs());
    int completedSessionLogs = toIntCount(summary.getCompletedSessionLogs());
    int totalDurationSeconds = toIntCount(summary.getTotalDurationSeconds());
    int autoLogs = toIntCount(summary.getAutoLogs());

    return new SummaryOverallResponse(
        totalSessionLogs,
        completedSessionLogs,
        totalSessionLogs - completedSessionLogs,
        totalDurationSeconds,
        totalSessionLogs == 0 ? 0 : Math.round((float) totalDurationSeconds / totalSessionLogs),
        autoLogs,
        totalSessionLogs - autoLogs
    );
  }

  private List<SummaryByTypeResponse> deriveSummaryByType(SummaryFilters filters) {
    Map<String, SessionLogRepository.SummaryByTypeView> summaryByType = new HashMap<>();
    for (SessionLogRepository.SummaryByTypeView aggregate : sessionLogRepository.summarizeByMeditationType(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source()
    )) {
      summaryByType.put(aggregate.getMeditationTypeCode(), aggregate);
    }

    return MEDITATION_TYPES.stream()
        .map((meditationType) -> {
          SessionLogRepository.SummaryByTypeView aggregate = summaryByType.get(meditationType);
          return new SummaryByTypeResponse(
              meditationType,
              toIntCount(aggregate == null ? 0 : aggregate.getSessionLogs()),
              toIntCount(aggregate == null ? 0 : aggregate.getTotalDurationSeconds())
          );
        })
        .toList();
  }

  private List<SummaryBySourceResponse> deriveSummaryBySource(SummaryFilters filters) {
    Map<String, SessionLogRepository.SummaryBySourceView> summaryBySource = new HashMap<>();
    for (SessionLogRepository.SummaryBySourceView aggregate : sessionLogRepository.summarizeBySource(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source()
    )) {
      summaryBySource.put(aggregate.getSource(), aggregate);
    }

    return SUMMARY_SOURCES.stream()
        .map((source) -> {
          SessionLogRepository.SummaryBySourceView aggregate = summaryBySource.get(source);
          int sessionLogs = toIntCount(aggregate == null ? 0 : aggregate.getSessionLogs());
          int completedSessionLogs = toIntCount(aggregate == null ? 0 : aggregate.getCompletedSessionLogs());

          return new SummaryBySourceResponse(
              source,
              sessionLogs,
              completedSessionLogs,
              sessionLogs - completedSessionLogs,
              toIntCount(aggregate == null ? 0 : aggregate.getTotalDurationSeconds())
          );
        })
        .toList();
  }

  private List<SummaryByTimeOfDayResponse> deriveSummaryByTimeOfDay(SummaryFilters filters) {
    Map<String, BucketTotals> totalsByBucket = new HashMap<>();
    for (String bucket : TIME_OF_DAY_BUCKETS) {
      totalsByBucket.put(bucket, new BucketTotals(0, 0, 0));
    }

    for (SessionLogRepository.SessionLogTimeSliceView entry : sessionLogRepository.findTimeSlices(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source()
    )) {
      String bucket = getTimeOfDayBucket(entry.getEndedAt(), filters.zoneId());
      BucketTotals current = totalsByBucket.get(bucket);
      totalsByBucket.put(
          bucket,
          new BucketTotals(
              current.sessionLogs() + 1,
              current.completedSessionLogs() + (isCompletedLog(entry.getStatus()) ? 1 : 0),
              current.totalDurationSeconds() + entry.getCompletedDurationSeconds()
          )
      );
    }

    return TIME_OF_DAY_BUCKETS.stream()
        .map((bucket) -> {
          BucketTotals totals = totalsByBucket.get(bucket);
          return new SummaryByTimeOfDayResponse(
              bucket,
              totals.sessionLogs(),
              totals.completedSessionLogs(),
              totals.sessionLogs() - totals.completedSessionLogs(),
              totals.totalDurationSeconds()
          );
        })
        .toList();
  }

  private boolean isCompletedLog(String status) {
    return COMPLETED_STATUS.contains(status);
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

  private SummaryFilters parseFilters(
      String startAtRaw,
      String endAtRaw,
      String timeZoneRaw,
      String meditationTypeRaw,
      String sourceRaw
  ) {
    Instant startAt = parseOptionalInstant(startAtRaw, "Start at must be a valid ISO timestamp.");
    Instant endAt = parseOptionalInstant(endAtRaw, "End at must be a valid ISO timestamp.");
    ZoneId zoneId = parseZoneId(timeZoneRaw);
    String meditationType = normalizeOptionalText(meditationTypeRaw);
    String source = normalizeOptionalText(sourceRaw);

    if (startAt != null && endAt != null && startAt.isAfter(endAt)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start at must be on or before end at.");
    }

    if (meditationType != null && !MEDITATION_TYPES.contains(meditationType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (source != null && !SUMMARY_SOURCES.contains(source)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session log source is invalid.");
    }

    return new SummaryFilters(startAt, endAt, zoneId, meditationType, source);
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

  private String normalizeOptionalText(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    return value.trim();
  }

  private int toIntCount(long value) {
    return Math.toIntExact(value);
  }

  private record SummaryFilters(
      Instant startAt,
      Instant endAt,
      ZoneId zoneId,
      String meditationType,
      String source
  ) {
  }

  private record BucketTotals(int sessionLogs, int completedSessionLogs, int totalDurationSeconds) {
  }
}
