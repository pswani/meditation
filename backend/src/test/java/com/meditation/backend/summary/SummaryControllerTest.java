package com.meditation.backend.summary;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meditation.backend.sessionlog.SessionLogEntity;
import com.meditation.backend.sessionlog.SessionLogRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SummaryControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @BeforeEach
  void clearSessionLogs() {
    sessionLogRepository.deleteAll();
  }

  @Test
  void returnsSummaryAggregatesAcrossTheExpectedCategories() throws Exception {
    Instant morningEndedAt = localInstant(2026, 3, 26, 6, 0);
    Instant eveningEndedAt = localInstant(2026, 3, 26, 19, 0);

    sessionLogRepository.saveAll(List.of(
        createSessionLog("log-1", "Vipassana", "auto log", "completed", morningEndedAt, 900),
        createSessionLog("log-2", "Ajapa", "manual log", "ended early", eveningEndedAt, 600)
    ));

    mockMvc.perform(get("/api/summaries").accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.overallSummary.totalSessionLogs").value(2))
        .andExpect(jsonPath("$.overallSummary.completedSessionLogs").value(1))
        .andExpect(jsonPath("$.overallSummary.endedEarlySessionLogs").value(1))
        .andExpect(jsonPath("$.overallSummary.totalDurationSeconds").value(1500))
        .andExpect(jsonPath("$.overallSummary.averageDurationSeconds").value(750))
        .andExpect(jsonPath("$.overallSummary.autoLogs").value(1))
        .andExpect(jsonPath("$.overallSummary.manualLogs").value(1))
        .andExpect(jsonPath("$.byTypeSummary[0].meditationType").value("Vipassana"))
        .andExpect(jsonPath("$.byTypeSummary[0].sessionLogs").value(1))
        .andExpect(jsonPath("$.byTypeSummary[1].meditationType").value("Ajapa"))
        .andExpect(jsonPath("$.byTypeSummary[1].sessionLogs").value(1))
        .andExpect(jsonPath("$.bySourceSummary[0].source").value("auto log"))
        .andExpect(jsonPath("$.bySourceSummary[0].completedSessionLogs").value(1))
        .andExpect(jsonPath("$.bySourceSummary[1].source").value("manual log"))
        .andExpect(jsonPath("$.bySourceSummary[1].endedEarlySessionLogs").value(1))
        .andExpect(jsonPath("$.byTimeOfDaySummary[0].timeOfDayBucket").value("morning"))
        .andExpect(jsonPath("$.byTimeOfDaySummary[0].sessionLogs").value(1))
        .andExpect(jsonPath("$.byTimeOfDaySummary[2].timeOfDayBucket").value("evening"))
        .andExpect(jsonPath("$.byTimeOfDaySummary[2].sessionLogs").value(1));
  }

  @Test
  void appliesInclusiveDateRangeFilteringToEndedAt() throws Exception {
    Instant includedBoundary = localInstant(2026, 3, 26, 7, 0);
    Instant includedInside = localInstant(2026, 3, 26, 12, 0);
    Instant excludedBefore = localInstant(2026, 3, 25, 23, 59);

    sessionLogRepository.saveAll(List.of(
        createSessionLog("log-before", "Vipassana", "auto log", "completed", excludedBefore, 900),
        createSessionLog("log-boundary", "Ajapa", "manual log", "completed", includedBoundary, 600),
        createSessionLog("log-inside", "Kriya", "auto log", "ended early", includedInside, 300)
    ));

    mockMvc.perform(get("/api/summaries")
            .queryParam("startAt", includedBoundary.toString())
            .queryParam("endAt", includedInside.toString())
            .accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.overallSummary.totalSessionLogs").value(2))
        .andExpect(jsonPath("$.overallSummary.totalDurationSeconds").value(900))
        .andExpect(jsonPath("$.byTypeSummary[1].sessionLogs").value(1))
        .andExpect(jsonPath("$.byTypeSummary[3].sessionLogs").value(1));
  }

  @Test
  void rejectsInvalidSummaryRangeParameters() throws Exception {
    mockMvc.perform(get("/api/summaries")
            .queryParam("startAt", "invalid")
            .accept(APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/summaries")
            .queryParam("startAt", "2026-03-26T12:00:00Z")
            .queryParam("endAt", "2026-03-26T11:00:00Z")
            .accept(APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/summaries")
            .queryParam("timeZone", "Mars/Olympus")
            .accept(APPLICATION_JSON))
        .andExpect(status().isBadRequest());
  }

  @Test
  void usesTheRequestedTimeZoneForTimeOfDayBuckets() throws Exception {
    sessionLogRepository.save(
        createSessionLog("log-zone", "Vipassana", "auto log", "completed", Instant.parse("2026-03-26T23:30:00Z"), 900)
    );

    mockMvc.perform(get("/api/summaries")
            .queryParam("timeZone", "Asia/Kolkata")
            .accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.byTimeOfDaySummary[0].timeOfDayBucket").value("morning"))
        .andExpect(jsonPath("$.byTimeOfDaySummary[0].sessionLogs").value(1));
  }

  private SessionLogEntity createSessionLog(
      String id,
      String meditationType,
      String source,
      String status,
      Instant endedAt,
      int completedDurationSeconds
  ) {
    return new SessionLogEntity(
        id,
        source,
        status,
        meditationType,
        endedAt.minusSeconds(completedDurationSeconds),
        endedAt,
        completedDurationSeconds,
        completedDurationSeconds,
        "None",
        "Temple Bell",
        false,
        0,
        "None",
        null,
        null,
        null,
        null,
        null,
        null,
        endedAt.plusSeconds(60)
    );
  }

  private Instant localInstant(int year, int month, int dayOfMonth, int hour, int minute) {
    return ZonedDateTime.of(year, month, dayOfMonth, hour, minute, 0, 0, ZoneId.systemDefault()).toInstant();
  }
}
