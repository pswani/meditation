package com.meditation.backend.sessionlog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionLogRepository extends JpaRepository<SessionLogEntity, String> {

  List<SessionLogEntity> findAllByOrderByEndedAtDescCreatedAtDesc();
}
