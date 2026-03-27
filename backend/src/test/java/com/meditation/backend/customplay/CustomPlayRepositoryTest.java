package com.meditation.backend.customplay;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class CustomPlayRepositoryTest {

  @Autowired
  private CustomPlayRepository customPlayRepository;

  @Test
  void returnsCustomPlaysOrderedByCreatedAtDescending() {
    customPlayRepository.save(new CustomPlayEntity(
        "custom-play-older",
        "Morning Focus",
        "Vipassana",
        20,
        "None",
        "Temple Bell",
        "media-vipassana-sit-20",
        false,
        "Breath emphasis",
        Instant.parse("2026-03-26T10:00:00Z"),
        Instant.parse("2026-03-26T10:00:00Z")
    ));
    customPlayRepository.save(new CustomPlayEntity(
        "custom-play-newer",
        "Evening Reset",
        "Ajapa",
        15,
        "Soft Chime",
        "Wood Block",
        "media-ajapa-breath-15",
        true,
        null,
        Instant.parse("2026-03-26T11:00:00Z"),
        Instant.parse("2026-03-26T11:00:00Z")
    ));

    List<CustomPlayEntity> customPlays = customPlayRepository.findAllByOrderByCreatedAtDesc();

    assertEquals(List.of("custom-play-newer", "custom-play-older"), customPlays.stream().map(CustomPlayEntity::getId).toList());
  }
}
