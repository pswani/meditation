package com.meditation.backend.playlist;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlaylistService {

  private static final Set<String> MEDITATION_TYPES = Set.of("Vipassana", "Ajapa", "Tratak", "Kriya", "Sahaj");

  private final PlaylistRepository playlistRepository;
  private final PlaylistItemRepository playlistItemRepository;

  public PlaylistService(
      PlaylistRepository playlistRepository,
      PlaylistItemRepository playlistItemRepository
  ) {
    this.playlistRepository = playlistRepository;
    this.playlistItemRepository = playlistItemRepository;
  }

  public List<PlaylistResponse> listPlaylists() {
    List<PlaylistEntity> playlists = playlistRepository.findAllByOrderByCreatedAtDesc();
    if (playlists.isEmpty()) {
      return List.of();
    }

    List<String> playlistIds = playlists.stream().map(PlaylistEntity::getId).toList();
    List<PlaylistItemEntity> items = playlistItemRepository.findAllByPlaylistIdInOrderByPlaylistIdAscPositionIndexAsc(playlistIds);
    Map<String, List<PlaylistItemEntity>> itemsByPlaylistId = groupItemsByPlaylistId(items);

    return playlists.stream()
        .map((playlist) -> toResponse(playlist, itemsByPlaylistId.getOrDefault(playlist.getId(), List.of())))
        .toList();
  }

  @Transactional
  public PlaylistResponse savePlaylist(String playlistId, PlaylistUpsertRequest request) {
    validateRequest(playlistId, request);

    PlaylistEntity existingPlaylist = playlistRepository.findById(playlistId).orElse(null);
    Instant now = Instant.now();
    PlaylistEntity playlist = playlistRepository.save(new PlaylistEntity(
        request.id(),
        request.name().trim(),
        request.favorite(),
        existingPlaylist == null ? 0 : existingPlaylist.getSmallGapSeconds(),
        existingPlaylist == null ? now : existingPlaylist.getCreatedAt(),
        now
    ));

    playlistItemRepository.deleteAllByPlaylistId(playlist.getId());
    List<PlaylistItemEntity> items = new ArrayList<>();
    for (int index = 0; index < request.items().size(); index += 1) {
      PlaylistItemUpsertRequest item = request.items().get(index);
      items.add(new PlaylistItemEntity(
          playlist.getId(),
          item.id().trim(),
          index,
          item.meditationType(),
          item.meditationType(),
          item.durationMinutes(),
          null,
          now
      ));
    }

    List<PlaylistItemEntity> savedItems = playlistItemRepository.saveAll(items);
    savedItems.sort((left, right) -> Integer.compare(left.getPositionIndex(), right.getPositionIndex()));
    return toResponse(playlist, savedItems);
  }

  @Transactional
  public void deletePlaylist(String playlistId) {
    playlistRepository.deleteById(playlistId);
  }

  private PlaylistResponse toResponse(PlaylistEntity playlist, List<PlaylistItemEntity> items) {
    return new PlaylistResponse(
        playlist.getId(),
        playlist.getName(),
        items.stream().map(this::toItemResponse).toList(),
        playlist.isFavorite(),
        playlist.getCreatedAt(),
        playlist.getUpdatedAt()
    );
  }

  private PlaylistItemResponse toItemResponse(PlaylistItemEntity item) {
    return new PlaylistItemResponse(
        item.getExternalId(),
        item.getMeditationTypeCode(),
        item.getDurationMinutes()
    );
  }

  private Map<String, List<PlaylistItemEntity>> groupItemsByPlaylistId(List<PlaylistItemEntity> items) {
    Map<String, List<PlaylistItemEntity>> itemsByPlaylistId = new HashMap<>();
    for (PlaylistItemEntity item : items) {
      itemsByPlaylistId.computeIfAbsent(item.getPlaylistId(), ignored -> new ArrayList<>()).add(item);
    }
    return itemsByPlaylistId;
  }

  private void validateRequest(String playlistId, PlaylistUpsertRequest request) {
    if (request.id() == null || request.id().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist id is required.");
    }

    if (!request.id().equals(playlistId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist id must match the route id.");
    }

    if (request.name() == null || request.name().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist name is required.");
    }

    if (request.items() == null || request.items().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist must contain at least 1 item.");
    }

    Set<String> seenItemIds = new HashSet<>();
    for (PlaylistItemUpsertRequest item : request.items()) {
      if (item.id() == null || item.id().isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item id is required.");
      }

      String normalizedItemId = item.id().trim();
      if (!seenItemIds.add(normalizedItemId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item ids must be unique.");
      }

      if (!MEDITATION_TYPES.contains(item.meditationType())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item meditation type is invalid.");
      }

      if (item.durationMinutes() <= 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist item duration must be greater than 0.");
      }
    }
  }
}
