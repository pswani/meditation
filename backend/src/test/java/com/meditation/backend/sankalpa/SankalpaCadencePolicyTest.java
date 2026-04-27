package com.meditation.backend.sankalpa;

import static org.assertj.core.api.Assertions.assertThat;

import com.meditation.backend.sessionlog.SessionLogRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;

class SankalpaCadencePolicyTest {

  private static final ZoneId UTC = ZoneId.of("UTC");

  private SankalpaGoalEntity makeGoal(
      String goalType,
      double targetValue,
      int days,
      Integer qualifyingDaysPerWeek,
      String createdAt
  ) {
    SankalpaGoalEntity goal = new SankalpaGoalEntity(
        "g1",
        null,
        goalType,
        BigDecimal.valueOf(targetValue),
        days,
        qualifyingDaysPerWeek,
        null,
        null,
        null,
        Instant.parse(createdAt),
        Instant.parse(createdAt),
        null,
        false
    );
    return goal;
  }

  // deriveDeadline

  @Test
  void deriveDeadline_singleDay_endsAtEndOfSameDay() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 5, 1, null, "2025-01-01T00:00:00Z");
    Instant deadline = SankalpaCadencePolicy.deriveDeadline(goal, UTC);
    assertThat(deadline.toString()).isEqualTo("2025-01-01T23:59:59.999999999Z");
  }

  @Test
  void deriveDeadline_sevenDays_endsAtEndOfDay7() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 5, 7, null, "2025-01-01T00:00:00Z");
    Instant deadline = SankalpaCadencePolicy.deriveDeadline(goal, UTC);
    assertThat(deadline.toString()).isEqualTo("2025-01-07T23:59:59.999999999Z");
  }

  // isRecurringCadenceGoal

  @Test
  void isRecurringCadenceGoal_withoutQualifyingDays_returnsFalse() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 5, 7, null, "2025-01-01T00:00:00Z");
    assertThat(SankalpaCadencePolicy.isRecurringCadenceGoal(goal)).isFalse();
  }

  @Test
  void isRecurringCadenceGoal_withQualifyingDays_returnsTrue() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 3, 7, 3, "2025-01-01T00:00:00Z");
    assertThat(SankalpaCadencePolicy.isRecurringCadenceGoal(goal)).isTrue();
  }

  // computeMatchTotals – flat session-count-based goal

  @Test
  void flatSessionCountGoal_matchedSessionCountReflectsTimeSlices() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 5, 7, null, "2025-01-01T00:00:00Z");
    List<SessionLogRepository.SessionLogTimeSliceView> slices = List.of(
        sliceAt("2025-01-02T10:00:00Z", 600),
        sliceAt("2025-01-03T10:00:00Z", 900)
    );
    Instant now = Instant.parse("2025-01-04T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, slices, List.of(), now, UTC);

    assertThat(totals.matchedSessionCount()).isEqualTo(2);
    assertThat(totals.matchedDurationSeconds()).isEqualTo(1500);
    assertThat(totals.metRecurringWeekCount()).isEqualTo(0);
    assertThat(totals.targetRecurringWeekCount()).isEqualTo(0);
  }

  // computeMatchTotals – recurring session-count goal (3/week over 2 weeks)

  @Test
  void recurringSessionCountGoal_weekMet_statusIsMet() {
    // targetValue=1 means 1 session/day qualifies; qualifyingDaysPerWeek=3 means 3 qualifying days/week
    SankalpaGoalEntity goal = makeGoal("session-count-based", 1, 14, 3, "2025-01-01T00:00:00Z");
    // Week 1: 1 session each on Jan 1, 2, 3 → 3 qualifying days → met
    // Week 2: 0 sessions → missed (today is Jan 15, after week 2)
    List<SessionLogRepository.SessionLogTimeSliceView> slices = List.of(
        sliceAt("2025-01-01T10:00:00Z", 300),
        sliceAt("2025-01-02T10:00:00Z", 300),
        sliceAt("2025-01-03T10:00:00Z", 300)
    );
    Instant now = Instant.parse("2025-01-15T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, slices, List.of(), now, UTC);

    assertThat(totals.metRecurringWeekCount()).isEqualTo(1);
    assertThat(totals.targetRecurringWeekCount()).isEqualTo(2);
    assertThat(totals.recurringWeeks()).hasSize(2);
    assertThat(totals.recurringWeeks().get(0).status()).isEqualTo("met");
    assertThat(totals.recurringWeeks().get(1).status()).isEqualTo("missed");
  }

  @Test
  void recurringSessionCountGoal_weekInProgress_statusIsActive() {
    SankalpaGoalEntity goal = makeGoal("session-count-based", 3, 7, 3, "2025-01-01T00:00:00Z");
    List<SessionLogRepository.SessionLogTimeSliceView> slices = List.of(
        sliceAt("2025-01-01T10:00:00Z", 300)
    );
    // Today is within week 1
    Instant now = Instant.parse("2025-01-03T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, slices, List.of(), now, UTC);

    assertThat(totals.recurringWeeks().get(0).status()).isEqualTo("active");
  }

  // computeMatchTotals – flat duration-based goal

  @Test
  void flatDurationGoal_matchedDurationSeconds() {
    SankalpaGoalEntity goal = makeGoal("duration-based", 30, 7, null, "2025-01-01T00:00:00Z");
    List<SessionLogRepository.SessionLogTimeSliceView> slices = List.of(
        sliceAt("2025-01-02T10:00:00Z", 1200),
        sliceAt("2025-01-03T10:00:00Z", 600)
    );
    Instant now = Instant.parse("2025-01-04T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, slices, List.of(), now, UTC);

    assertThat(totals.matchedDurationSeconds()).isEqualTo(1800);
  }

  // computeMatchTotals – observance-based goal

  @Test
  void observanceGoal_countsSummedCorrectly() {
    SankalpaGoalEntity goal = makeGoal("observance-based", 5, 7, null, "2025-01-01T00:00:00Z");
    List<SankalpaObservanceEntryEntity> entries = List.of(
        entry("2025-01-01", "observed"),
        entry("2025-01-02", "observed"),
        entry("2025-01-03", "missed")
    );
    Instant now = Instant.parse("2025-01-04T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, List.of(), entries, now, UTC);

    assertThat(totals.matchedObservanceCount()).isEqualTo(2);
    assertThat(totals.missedObservanceCount()).isEqualTo(1);
    assertThat(totals.pendingObservanceCount()).isEqualTo(4);
    assertThat(totals.observanceDays()).hasSize(7);
  }

  @Test
  void weeklyObservanceGoal_weekMet_statusIsMet() {
    SankalpaGoalEntity goal = makeGoal("observance-based", 3, 7, 3, "2025-01-01T00:00:00Z");
    List<SankalpaObservanceEntryEntity> entries = List.of(
        entry("2025-01-01", "observed"),
        entry("2025-01-02", "observed"),
        entry("2025-01-03", "observed")
    );
    Instant now = Instant.parse("2025-01-08T12:00:00Z");

    SankalpaCadencePolicy.SankalpaMatchTotals totals =
        SankalpaCadencePolicy.computeMatchTotals(goal, List.of(), entries, now, UTC);

    assertThat(totals.metRecurringWeekCount()).isEqualTo(1);
    assertThat(totals.recurringWeeks().get(0).status()).isEqualTo("met");
  }

  private SessionLogRepository.SessionLogTimeSliceView sliceAt(String endedAt, int durationSeconds) {
    return new SessionLogRepository.SessionLogTimeSliceView() {
      @Override
      public Instant getEndedAt() {
        return Instant.parse(endedAt);
      }

      @Override
      public String getStatus() {
        return "completed";
      }

      @Override
      public int getCompletedDurationSeconds() {
        return durationSeconds;
      }
    };
  }

  private SankalpaObservanceEntryEntity entry(String date, String status) {
    SankalpaObservanceEntryEntity e = new SankalpaObservanceEntryEntity(
        "g1",
        java.time.LocalDate.parse(date),
        status,
        Instant.EPOCH
    );
    return e;
  }
}
