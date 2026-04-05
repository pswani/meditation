package com.meditation.backend.summary;

import com.meditation.backend.reference.ReferenceData;
import com.meditation.backend.sessionlog.SessionLogRepository;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SummaryService {

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

    return ReferenceData.MEDITATION_TYPES.stream()
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

    return ReferenceData.SESSION_LOG_SOURCES.stream()
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
    for (String bucket : ReferenceData.TIME_OF_DAY_BUCKETS) {
      totalsByBucket.put(bucket, new BucketTotals(0, 0, 0));
    }

    for (SessionLogRepository.SessionLogTimeSliceView entry : sessionLogRepository.findTimeSlices(
        filters.startAt(),
        filters.endAt(),
        filters.meditationType(),
        filters.source()
    )) {
      String bucket = ReferenceData.resolveTimeOfDayBucket(entry.getEndedAt(), filters.zoneId());
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

    return ReferenceData.TIME_OF_DAY_BUCKETS.stream()
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
    return ReferenceData.isCompletedSessionLogStatus(status);
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

    if (meditationType != null && !ReferenceData.isMeditationType(meditationType)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meditation type is invalid.");
    }

    if (source != null && !ReferenceData.isSessionLogSource(source)) {
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
