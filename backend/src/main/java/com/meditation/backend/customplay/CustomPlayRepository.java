package com.meditation.backend.customplay;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomPlayRepository extends JpaRepository<CustomPlayEntity, String> {

  List<CustomPlayEntity> findAllByOrderByCreatedAtDesc();

  @Query("select customPlay.id from CustomPlayEntity customPlay where customPlay.id in :ids")
  Set<String> findExistingIdsByIdIn(@Param("ids") Collection<String> ids);
}
