package com.meditation.backend.sankalpa;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SankalpaGoalRepository extends JpaRepository<SankalpaGoalEntity, String> {

  List<SankalpaGoalEntity> findAllByArchivedFalseOrderByCreatedAtDesc();
}
