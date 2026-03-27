package com.meditation.backend.sessionlog;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionLogRepository extends JpaRepository<SessionLogEntity, String> {

  List<SessionLogEntity> findAllByOrderByEndedAtDescCreatedAtDesc();

  List<SessionLogEntity> findAllByEndedAtGreaterThanEqualOrderByEndedAtDescCreatedAtDesc(Instant startAt);

  List<SessionLogEntity> findAllByEndedAtLessThanEqualOrderByEndedAtDescCreatedAtDesc(Instant endAt);

  List<SessionLogEntity> findAllByEndedAtBetweenOrderByEndedAtDescCreatedAtDesc(Instant startAt, Instant endAt);
}
