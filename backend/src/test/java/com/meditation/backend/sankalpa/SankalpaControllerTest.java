package com.meditation.backend.sankalpa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meditation.backend.sessionlog.SessionLogEntity;
import com.meditation.backend.sessionlog.SessionLogRepository;
import com.meditation.backend.sync.SyncRequestSupport;
import java.time.Instant;
import java.time.LocalDate;
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

  @Autowired
  private SankalpaObservanceEntryRepository sankalpaObservanceEntryRepository;

  @BeforeEach
  void clearData() {
    sankalpaObservanceEntryRepository.deleteAll();
    sankalpaGoalRepository.deleteAll();
    sessionLogRepository.deleteAll();
  }

  @Test
  void returnsBackendDerivedProgressAcrossGoalTypes() throws Exception {
    Instant createdAt = localInstant(2026, 3, 20, 6, 0);
    sankalpaGoalRepository.saveAll(List.of(
        createSankalpaGoalEntity("goal-duration", "duration-based", java.math.BigDecimal.valueOf(30), 7, null, "Vipassana", "morning", null, createdAt, createdAt, null, false),
        createSankalpaGoalEntity("goal-count", "session-count-based", java.math.BigDecimal.valueOf(2), 7, null, null, null, null, createdAt, createdAt, null, false)
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
  void derivesRecurringWeeklyCadenceProgress() throws Exception {
    Instant createdAt = localInstant(2026, 4, 5, 8, 0);
    sankalpaGoalRepository.save(
        createSankalpaGoalEntity(
            "goal-recurring",
            "duration-based",
            java.math.BigDecimal.valueOf(15),
            14,
            5,
            "Tratak",
            null,
            null,
            createdAt,
            createdAt,
            null,
            false
        )
    );
    sessionLogRepository.saveAll(List.of(
        createSessionLog("log-r1", "Tratak", localInstant(2026, 4, 5, 9, 0), 900),
        createSessionLog("log-r2", "Tratak", localInstant(2026, 4, 6, 9, 0), 900),
        createSessionLog("log-r3", "Tratak", localInstant(2026, 4, 7, 9, 0), 900),
        createSessionLog("log-r4", "Tratak", localInstant(2026, 4, 8, 9, 0), 900),
        createSessionLog("log-r5", "Tratak", localInstant(2026, 4, 9, 9, 0), 900),
        createSessionLog("log-r6", "Tratak", localInstant(2026, 4, 12, 9, 0), 900),
        createSessionLog("log-r7", "Tratak", localInstant(2026, 4, 13, 9, 0), 900)
    ));

    mockMvc.perform(get("/api/sankalpas")
            .queryParam("timeZone", ZoneId.systemDefault().getId())
            .accept(APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].goal.qualifyingDaysPerWeek").value(5))
        .andExpect(jsonPath("$[0].metRecurringWeekCount").value(1))
        .andExpect(jsonPath("$[0].targetRecurringWeekCount").value(2))
        .andExpect(jsonPath("$[0].recurringWeeks[0].status").value("met"))
        .andExpect(jsonPath("$[0].recurringWeeks[0].qualifyingDayCount").value(5))
        .andExpect(jsonPath("$[0].targetDurationSeconds").value(0))
        .andExpect(jsonPath("$[0].status").value("active"));
  }

  @Test
  void returnsArchivedGoalsWithArchivedStatus() throws Exception {
    sankalpaGoalRepository.save(
        createSankalpaGoalEntity(
            "goal-archived",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            null,
            null,
            null,
            Instant.parse("2026-03-24T00:00:00Z"),
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

    mockMvc.perform(put("/api/sankalpas/goal-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-1",
                  "goalType": "duration-based",
                  "targetValue": 15,
                  "days": 10,
                  "qualifyingDaysPerWeek": 5,
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
        createSankalpaGoalEntity(
            "goal-zone",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            null,
            "morning",
            null,
            Instant.parse("2026-03-24T00:00:00Z"),
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

  @Test
  void deletesArchivedSankalpas() throws Exception {
    Instant createdAt = Instant.parse("2026-03-24T00:00:00Z");
    sankalpaGoalRepository.save(
        createSankalpaGoalEntity(
            "goal-delete",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            null,
            null,
            null,
            createdAt,
            createdAt.plusSeconds(120),
            null,
            true
        )
    );

    mockMvc.perform(delete("/api/sankalpas/goal-delete"))
        .andExpect(status().isNoContent());

    assertThat(sankalpaGoalRepository.findById("goal-delete")).isEmpty();
  }

  @Test
  void rejectsDeletingNonArchivedSankalpas() throws Exception {
    Instant createdAt = Instant.parse("2026-03-24T00:00:00Z");
    sankalpaGoalRepository.save(
        createSankalpaGoalEntity(
            "goal-active",
            "session-count-based",
            java.math.BigDecimal.ONE,
            7,
            null,
            null,
            null,
            null,
            createdAt,
            createdAt.plusSeconds(120),
            null,
            false
        )
    );

    mockMvc.perform(delete("/api/sankalpas/goal-active"))
        .andExpect(status().isConflict());
  }

  @Test
  void returnsCurrentSankalpaWhenDeleteIsStale() throws Exception {
    Instant createdAt = Instant.parse("2026-03-24T00:00:00Z");
    Instant updatedAt = Instant.parse("2026-03-24T12:00:00Z");
    sankalpaGoalRepository.save(
        createSankalpaGoalEntity(
            "goal-stale",
            "duration-based",
            java.math.BigDecimal.valueOf(20),
            7,
            null,
            "Vipassana",
            "morning",
            null,
            createdAt,
            updatedAt,
            null,
            true
        )
    );

    mockMvc.perform(delete("/api/sankalpas/goal-stale")
            .queryParam("timeZone", "America/Chicago")
            .header(SyncRequestSupport.SYNC_QUEUED_AT_HEADER, "2026-03-24T11:00:00Z"))
        .andExpect(status().isOk())
        .andExpect(header().string("X-Meditation-Sync-Result", "stale"))
        .andExpect(jsonPath("$.outcome").value("stale"))
        .andExpect(jsonPath("$.currentRecord.goal.id").value("goal-stale"))
        .andExpect(jsonPath("$.currentSankalpa.goal.id").value("goal-stale"))
        .andExpect(jsonPath("$.currentSankalpa.status").value("archived"));

    assertThat(sankalpaGoalRepository.findById("goal-stale")).isPresent();
  }

  @Test
  void upsertsAndListsObservanceGoals() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-observance")
            .queryParam("timeZone", "America/Chicago")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-observance",
                  "goalType": "observance-based",
                  "targetValue": 3,
                  "days": 3,
                  "observanceLabel": "Meal before 7 PM",
                  "observanceRecords": [
                    { "date": "2026-04-05", "status": "observed" },
                    { "date": "2026-04-06", "status": "missed" }
                  ],
                  "createdAt": "2026-04-05T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.goal.goalType").value("observance-based"))
        .andExpect(jsonPath("$.goal.observanceLabel").value("Meal before 7 PM"))
        .andExpect(jsonPath("$.goal.observanceRecords[0].date").value("2026-04-05"))
        .andExpect(jsonPath("$.matchedObservanceCount").value(1))
        .andExpect(jsonPath("$.missedObservanceCount").value(1))
        .andExpect(jsonPath("$.pendingObservanceCount").value(1))
        .andExpect(jsonPath("$.targetObservanceCount").value(3))
        .andExpect(jsonPath("$.observanceDays[2].date").value("2026-04-07"));

    assertThat(sankalpaObservanceEntryRepository.findAllBySankalpaIdInOrderByObservanceDateAsc(List.of("goal-observance")))
        .extracting(SankalpaObservanceEntryEntity::getObservanceDate)
        .containsExactly(LocalDate.parse("2026-04-05"), LocalDate.parse("2026-04-06"));
  }

  @Test
  void upsertsWeeklyObservanceGoalsFromManualCheckIns() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-gym")
            .queryParam("timeZone", "America/Chicago")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-gym",
                  "goalType": "observance-based",
                  "targetValue": 5,
                  "days": 28,
                  "qualifyingDaysPerWeek": 5,
                  "observanceLabel": "Gym",
                  "observanceRecords": [
                    { "date": "2026-04-05", "status": "observed" },
                    { "date": "2026-04-06", "status": "observed" },
                    { "date": "2026-04-07", "status": "observed" },
                    { "date": "2026-04-08", "status": "observed" },
                    { "date": "2026-04-09", "status": "observed" },
                    { "date": "2026-04-12", "status": "observed" },
                    { "date": "2026-04-13", "status": "missed" },
                    { "date": "2026-04-14", "status": "observed" }
                  ],
                  "createdAt": "2026-04-05T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.goal.goalType").value("observance-based"))
        .andExpect(jsonPath("$.goal.observanceLabel").value("Gym"))
        .andExpect(jsonPath("$.goal.qualifyingDaysPerWeek").value(5))
        .andExpect(jsonPath("$.matchedObservanceCount").value(7))
        .andExpect(jsonPath("$.missedObservanceCount").value(1))
        .andExpect(jsonPath("$.targetObservanceCount").value(20))
        .andExpect(jsonPath("$.metRecurringWeekCount").value(1))
        .andExpect(jsonPath("$.targetRecurringWeekCount").value(4))
        .andExpect(jsonPath("$.recurringWeeks[0].status").value("met"))
        .andExpect(jsonPath("$.recurringWeeks[1].qualifyingDayCount").value(2))
        .andExpect(jsonPath("$.progressRatio").value(0.25));
  }

  @Test
  void rejectsObservanceGoalsWithDatesOutsideTheGoalWindow() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-observance")
            .queryParam("timeZone", "America/Chicago")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-observance",
                  "goalType": "observance-based",
                  "targetValue": 3,
                  "days": 3,
                  "observanceLabel": "Meal before 7 PM",
                  "observanceRecords": [
                    { "date": "2026-04-09", "status": "observed" }
                  ],
                  "createdAt": "2026-04-05T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void rejectsInvalidWeeklyObservanceGoals() throws Exception {
    mockMvc.perform(put("/api/sankalpas/goal-gym")
            .queryParam("timeZone", "America/Chicago")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-gym",
                  "goalType": "observance-based",
                  "targetValue": 5,
                  "days": 27,
                  "qualifyingDaysPerWeek": 5,
                  "observanceLabel": "Gym",
                  "createdAt": "2026-04-05T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(put("/api/sankalpas/goal-gym")
            .queryParam("timeZone", "America/Chicago")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "goal-gym",
                  "goalType": "observance-based",
                  "targetValue": 4,
                  "days": 28,
                  "qualifyingDaysPerWeek": 5,
                  "observanceLabel": "Gym",
                  "createdAt": "2026-04-05T08:00:00Z",
                  "archived": false
                }
                """))
        .andExpect(status().isBadRequest());
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

  private SankalpaGoalEntity createSankalpaGoalEntity(
      String id,
      String goalType,
      java.math.BigDecimal targetValue,
      int days,
      Integer qualifyingDaysPerWeek,
      String meditationTypeCode,
      String timeOfDayBucket,
      String observanceLabel,
      Instant createdAt,
      Instant updatedAt,
      Instant completedAt,
      boolean archived
  ) {
    return new SankalpaGoalEntity(
        id,
        goalType,
        targetValue,
        days,
        qualifyingDaysPerWeek,
        meditationTypeCode,
        timeOfDayBucket,
        observanceLabel,
        createdAt,
        updatedAt,
        completedAt,
        archived
    );
  }
}
