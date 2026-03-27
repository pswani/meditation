package com.meditation.backend.playlist;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistRepository extends JpaRepository<PlaylistEntity, String> {

  List<PlaylistEntity> findAllByOrderByCreatedAtDesc();
}
