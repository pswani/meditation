package com.meditation.backend.playlist;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.meditation.backend.sessionlog.SessionLogEntity;
import com.meditation.backend.sessionlog.SessionLogRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlaylistControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private PlaylistItemRepository playlistItemRepository;

  @Autowired
  private PlaylistRepository playlistRepository;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @BeforeEach
  void clearPlaylists() {
    sessionLogRepository.deleteAll();
    playlistItemRepository.deleteAll();
    playlistRepository.deleteAll();
  }

  @Test
  void savesListsAndDeletesPlaylistsThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/playlists/playlist-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "playlist-1",
                  "name": "Morning Sequence",
                  "favorite": true,
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Vipassana",
                      "durationMinutes": 10
                    },
                    {
                      "id": "item-2",
                      "meditationType": "Ajapa",
                      "durationMinutes": 15
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("playlist-1"))
        .andExpect(jsonPath("$.favorite").value(true))
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].id").value("item-1"));

    mockMvc.perform(get("/api/playlists"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Morning Sequence"))
        .andExpect(jsonPath("$[0].items[1].meditationType").value("Ajapa"));

    mockMvc.perform(delete("/api/playlists/playlist-1"))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/playlists"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void rejectsInvalidPlaylistItems() throws Exception {
    mockMvc.perform(put("/api/playlists/playlist-invalid")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "playlist-invalid",
                  "name": "Broken Sequence",
                  "favorite": false,
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Breathwork",
                      "durationMinutes": 0
                    }
                  ]
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void deletingAPlaylistPreservesReadableHistoryContext() throws Exception {
    mockMvc.perform(put("/api/playlists/playlist-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "playlist-1",
                  "name": "Morning Sequence",
                  "favorite": false,
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Vipassana",
                      "durationMinutes": 10
                    }
                  ]
                }
                """))
        .andExpect(status().isOk());

    sessionLogRepository.save(new SessionLogEntity(
        "session-log-1",
        "auto log",
        "completed",
        "Vipassana",
        Instant.parse("2026-03-26T10:00:00Z"),
        Instant.parse("2026-03-26T10:10:00Z"),
        600,
        600,
        "None",
        "None",
        false,
        0,
        "None",
        "playlist-1",
        "Morning Sequence",
        1,
        1,
        "playlist-1-run-1",
        Instant.parse("2026-03-26T10:00:00Z"),
        Instant.parse("2026-03-26T10:10:00Z")
    ));

    mockMvc.perform(delete("/api/playlists/playlist-1"))
        .andExpect(status().isNoContent());

    List<SessionLogEntity> sessionLogs = sessionLogRepository.findAllByOrderByEndedAtDescCreatedAtDesc();
    assertEquals(1, sessionLogs.size());
    assertNull(sessionLogs.get(0).getPlaylistId());
    assertEquals("Morning Sequence", sessionLogs.get(0).getPlaylistName());
  }

  @Test
  void allowsDifferentPlaylistsToReuseTheSamePlaylistItemId() throws Exception {
    mockMvc.perform(put("/api/playlists/playlist-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "playlist-1",
                  "name": "Morning Sequence",
                  "favorite": false,
                  "items": [
                    {
                      "id": "shared-item",
                      "meditationType": "Vipassana",
                      "durationMinutes": 10
                    }
                  ]
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/playlists/playlist-2")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "playlist-2",
                  "name": "Evening Sequence",
                  "favorite": true,
                  "items": [
                    {
                      "id": "shared-item",
                      "meditationType": "Ajapa",
                      "durationMinutes": 15
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("playlist-2"))
        .andExpect(jsonPath("$.items[0].id").value("shared-item"));

    mockMvc.perform(get("/api/playlists"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].items[0].id").value("shared-item"))
        .andExpect(jsonPath("$[1].items[0].id").value("shared-item"));
  }

  @Test
  void ignoresStaleQueuedPlaylistMutations() throws Exception {
    mockMvc.perform(put("/api/playlists/playlist-1")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2026-03-27T10:15:00Z")
            .content("""
                {
                  "id": "playlist-1",
                  "name": "Morning Sequence",
                  "createdAt": "2026-03-27T10:15:00Z",
                  "updatedAt": "2026-03-27T10:15:00Z",
                  "favorite": false,
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Vipassana",
                      "durationMinutes": 10
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Morning Sequence"));

    mockMvc.perform(put("/api/playlists/playlist-1")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2026-03-27T10:10:00Z")
            .content("""
                {
                  "id": "playlist-1",
                  "name": "Stale Sequence",
                  "createdAt": "2026-03-27T10:10:00Z",
                  "updatedAt": "2026-03-27T10:10:00Z",
                  "favorite": true,
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Ajapa",
                      "durationMinutes": 15
                    }
                  ]
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Morning Sequence"))
        .andExpect(jsonPath("$.favorite").value(false))
        .andExpect(jsonPath("$.items[0].meditationType").value("Vipassana"));

    mockMvc.perform(delete("/api/playlists/playlist-1")
            .header("X-Meditation-Sync-Queued-At", "2026-03-27T10:05:00Z"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.outcome").value("stale"))
        .andExpect(jsonPath("$.currentPlaylist.name").value("Morning Sequence"));

    mockMvc.perform(get("/api/playlists"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Morning Sequence"));
  }
}
