package com.meditation.backend.settings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class TimerSettingsRepositoryTest {

  @Autowired
  private TimerSettingsRepository timerSettingsRepository;

  @Test
  void loadsSeededSettingsAndPersistsUpdates() {
    TimerSettingsEntity seeded = timerSettingsRepository.findById("default").orElseThrow();

    assertEquals(20, seeded.getDurationMinutes());
    assertNull(seeded.getMeditationTypeCode());
    assertEquals("Temple Bell", seeded.getEndSound());

    Instant updatedAt = Instant.parse("2026-03-26T15:45:00Z");
    seeded.updateFrom(new TimerSettingsUpsertRequest(
        "fixed",
        32,
        "Sahaj",
        "Soft Chime",
        "Temple Bell",
        true,
        8,
        "Wood Block"
    ), updatedAt);

    timerSettingsRepository.saveAndFlush(seeded);

    TimerSettingsEntity reloaded = timerSettingsRepository.findById("default").orElseThrow();

    assertEquals(32, reloaded.getDurationMinutes());
    assertEquals("Sahaj", reloaded.getMeditationTypeCode());
    assertEquals("Soft Chime", reloaded.getStartSound());
    assertTrue(reloaded.isIntervalEnabled());
    assertEquals(8, reloaded.getIntervalMinutes());
    assertEquals("Wood Block", reloaded.getIntervalSound());
    assertEquals(updatedAt, reloaded.getUpdatedAt());
  }
}
