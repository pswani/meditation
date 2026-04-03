package com.meditation.backend.sankalpa;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class SankalpaControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SankalpaGoalRepository sankalpaGoalRepository;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @BeforeEach
  void clearData() {
    sankalpaGoalRepository.deleteAll();
    sessionLogRepository.deleteAll();
  }

  @Test
  void returnsBackendDerivedProgressAcrossGoalTypes() throws Exception {
    Instant createdAt = localInstant(2026, 3, 20, 6, 0);
    sankalpaGoalRepository.saveAll(List.of(
        new SankalpaGoalEntity("goal-duration", "duration-based", java.math.BigDecimal.valueOf(30), 7, "Vipassana", "morning", createdAt, null, false),
        new SankalpaGoalEntity("goal-count", "session-count-based", java.math.BigDecimal.valueOf(2), 7, null, null, createdAt, null, false)
    ));
    sessionLogRepository.saveAll(List.of(
        createSessionLog("log-1", "Vipassana", localInstant(2026, 3, 21, 7, 0), 900),
        createSessionLog("log-2", "Vipassana", localInstant(2026, 3, 22, 7, 30), 1200),
        createSessionLog("log-3", "Ajapa", localInstant(2026, 3, 22, 18, 0), 600)
    ));

    mockMvc.perform(get("/api/sankalpas").accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].goal.id").value("goal-duration"))
        .andExpect(jsonPath("$[0].status").value("completed"))
        .andExpect(jsonPath("$[0].matchedSessionCount").value(2))
        .andExpect(jsonPath("$[0].matchedDurationSeconds").value(2100))
        .andExpect(jsonPath("$[0].targetDurationSeconds").value(1800))
        .andExpect(jsonPath("$[1].goal.id").value("goal-count"))
        .andExpect(jsonPath("$[1].status").value("completed"))
        .andExpect(jsonPath("$[1].matchedSessionCount").value(3))
        .andExpect(jsonPath("$[1].targetSessionCount").value(2));
  }

  @Test
  void upsertsFractionalDurationGoalTargets() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-1",
                  "goalType": "duration-based",
                  "targetValue": 12.5,
                  "days": 5,
                  "meditationType": "Vipassana",
                  "timeOfDayBucket": "morning",
                  "createdAt": "2026-03-24T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.goal.id").value("goal-1"))
        .andExpect(jsonPath("$.goal.targetValue").value(12.5))
        .andExpect(jsonPath("$.goal.archived").value(false))
        .andExpect(jsonPath("$.targetDurationSeconds").value(750));
  }

  @Test
  void returnsArchivedGoalsWithArchivedStatus() throws Exception {
    sankalpaGoalRepository.save(
        new SankalpaGoalEntity(
            "goal-archived",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            null,
            Instant.parse("2026-03-24T00:00:00Z"),
            null,
            true
        )
    );

    mockMvc.perform(get("/api/sankalpas").accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].goal.id").value("goal-archived"))
        .andExpect(jsonPath("$[0].goal.archived").value(true))
        .andExpect(jsonPath("$[0].status").value("archived"));
  }

  @Test
  void rejectsInvalidGoalRequests() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-2",
                  "goalType": "duration-based",
                  "targetValue": 12.5,
                  "days": 5,
                  "createdAt": "2026-03-24T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(put("/api/sankalpas/goal-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-1",
                  "goalType": "session-count-based",
                  "targetValue": 2.5,
                  "days": 5,
                  "createdAt": "2026-03-24T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/sankalpas")
            .queryParam("timeZone", "Mars/Olympus")
            .accept(APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    mockMvc.perform(put("/api/sankalpas/goal-1")
            .queryParam("timeZone", "Mars/Olympus")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-1",
                  "goalType": "duration-based",
                  "targetValue": 12.5,
                  "days": 5,
                  "createdAt": "2026-03-24T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void usesTheRequestedTimeZoneWhenApplyingTimeOfDayFilters() throws Exception {
    sankalpaGoalRepository.save(
        new SankalpaGoalEntity(
            "goal-zone",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            "morning",
            Instant.parse("2026-03-24T00:00:00Z"),
            null,
            false
        )
    );
    sessionLogRepository.save(createSessionLog("log-zone", "Vipassana", Instant.parse("2026-03-26T23:30:00Z"), 900));

    mockMvc.perform(get("/api/sankalpas")
            .queryParam("timeZone", "Asia/Kolkata")
            .accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].matchedSessionCount").value(1))
        .andExpect(jsonPath("$[0].status").value("completed"));
  }

  private SessionLogEntity createSessionLog(String id, String meditationType, Instant endedAt, int completedDurationSeconds) {
    return new SessionLogEntity(
        id,
        "auto log",
        "completed",
        meditationType,
        "fixed",
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
