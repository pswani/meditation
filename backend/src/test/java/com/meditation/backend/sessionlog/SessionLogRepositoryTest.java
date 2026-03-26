package com.meditation.backend.sessionlog;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class SessionLogRepositoryTest {

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @Test
  void returnsSessionLogsOrderedByEndedAtDescending() {
    sessionLogRepository.save(new SessionLogEntity(
        "log-older",
        "auto log",
        "completed",
        "Vipassana",
        Instant.parse("2026-03-26T10:00:00Z"),
        Instant.parse("2026-03-26T10:20:00Z"),
        1200,
        1200,
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
        Instant.parse("2026-03-26T10:20:00Z")
    ));
    sessionLogRepository.save(new SessionLogEntity(
        "log-newer",
        "manual log",
        "completed",
        "Ajapa",
        Instant.parse("2026-03-26T11:00:00Z"),
        Instant.parse("2026-03-26T11:15:00Z"),
        900,
        900,
        "None",
        "None",
        false,
        0,
        "None",
        null,
        null,
        null,
        null,
        null,
        null,
        Instant.parse("2026-03-26T11:15:00Z")
    ));

    List<SessionLogEntity> sessionLogs = sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc();

    assertEquals(List.of("log-newer", "log-older"), sessionLogs.stream().map(SessionLogEntity::getId).toList());
  }
}
