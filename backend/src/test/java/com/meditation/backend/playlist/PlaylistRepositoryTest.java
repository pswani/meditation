package com.meditation.backend.playlist;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class PlaylistRepositoryTest {

  @Autowired
  private PlaylistRepository playlistRepository;

  @Autowired
  private PlaylistItemRepository playlistItemRepository;

  @Test
  void returnsPlaylistsOrderedByCreatedAtDescendingAndItemsByPosition() {
    playlistRepository.save(new PlaylistEntity(
        "playlist-older",
        "Morning Sequence",
        false,
        0,
        Instant.parse("2026-03-26T10:00:00Z"),
        Instant.parse("2026-03-26T10:00:00Z")
    ));
    playlistRepository.save(new PlaylistEntity(
        "playlist-newer",
        "Evening Reset",
        true,
        0,
        Instant.parse("2026-03-26T11:00:00Z"),
        Instant.parse("2026-03-26T11:00:00Z")
    ));

    playlistItemRepository.saveAll(List.of(
        new PlaylistItemEntity(
            "playlist-newer",
            "item-2",
            1,
            "Ajapa",
            "Ajapa",
            12,
            null,
            Instant.parse("2026-03-26T11:00:00Z")
        ),
        new PlaylistItemEntity(
            "playlist-newer",
            "item-1",
            0,
            "Vipassana",
            "Vipassana",
            10,
            null,
            Instant.parse("2026-03-26T11:00:00Z")
        )
    ));

    List<PlaylistEntity> playlists = playlistRepository.findAllByOrderByCreatedAtDesc();
    List<PlaylistItemEntity> items =
        playlistItemRepository.findAllByPlaylistIdInOrderByPlaylistIdAscPositionIndexAsc(List.of("playlist-newer"));

    assertEquals(List.of("playlist-newer", "playlist-older"), playlists.stream().map(PlaylistEntity::getId).toList());
    assertEquals(List.of("item-1", "item-2"), items.stream().map(PlaylistItemEntity::getExternalId).toList());
  }
}
