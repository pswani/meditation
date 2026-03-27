package com.meditation.backend.playlist;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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
      @RequestBody PlaylistUpsertRequest request
  ) {
    return playlistService.savePlaylist(playlistId, request);
  }

  @DeleteMapping("/{playlistId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePlaylist(@PathVariable String playlistId) {
    playlistService.deletePlaylist(playlistId);
  }
}
