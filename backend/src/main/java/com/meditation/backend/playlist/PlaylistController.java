package com.meditation.backend.playlist;

import com.meditation.backend.sync.SyncRequestSupport;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

  private final PlaylistService playlistService;

  public PlaylistController(PlaylistService playlistService) {
    this.playlistService = playlistService;
  }

  @GetMapping
  public List<PlaylistResponse> listPlaylists() {
    return playlistService.listPlaylists();
  }

  @PutMapping("/{playlistId}")
  public PlaylistResponse savePlaylist(
      @PathVariable String playlistId,
      @RequestBody PlaylistUpsertRequest request,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    return playlistService.savePlaylist(playlistId, request, syncQueuedAt);
  }

  @DeleteMapping("/{playlistId}")
  public ResponseEntity<PlaylistDeleteResult> deletePlaylist(
      @PathVariable String playlistId,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    PlaylistDeleteResult result = playlistService.deletePlaylist(playlistId, syncQueuedAt);
    if ("stale".equals(result.outcome())) {
      return ResponseEntity.ok(result);
    }

    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}
