package com.meditation.backend.playlist;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaylistItemRepository extends JpaRepository<PlaylistItemEntity, Long> {

  List<PlaylistItemEntity> findAllByPlaylistIdInOrderByPlaylistIdAscPositionIndexAsc(Collection<String> playlistIds);

  void deleteAllByPlaylistId(String playlistId);
}
