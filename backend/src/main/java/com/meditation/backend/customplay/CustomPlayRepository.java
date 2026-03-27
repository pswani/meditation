package com.meditation.backend.customplay;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomPlayRepository extends JpaRepository<CustomPlayEntity, String> {

  List<CustomPlayEntity> findAllByOrderByCreatedAtDesc();
}
