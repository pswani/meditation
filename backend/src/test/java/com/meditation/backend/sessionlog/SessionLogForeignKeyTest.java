package com.meditation.backend.sessionlog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
class SessionLogForeignKeyTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @BeforeEach
  void clearData() {
    sessionLogRepository.deleteAll();
  }

  @Test
  void deletingCustomPlayNullsCustomPlayIdButRetainsName() throws Exception {
    // Create a custom play using a seeded media asset from V2 reference data
    mockMvc.perform(put("/api/custom-plays/cp-fk-test")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "cp-fk-test",
                  "name": "Morning Sit",
                  "meditationType": "Vipassana",
                  "durationMinutes": 20,
                  "startSound": "Soft Chime",
                  "endSound": "Temple Bell",
                  "mediaAssetId": "media-vipassana-sit-20",
                  "recordingLabel": "Breath emphasis",
                  "favorite": false
                }
                """))
        .andExpect(status().isOk());

    // Log a session referencing the custom play
    Instant now = Instant.now();
    mockMvc.perform(put("/api/session-logs/log-fk-cp")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-fk-cp",
                  "source": "auto log",
                  "status": "completed",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "startedAt": "%s",
                  "endedAt": "%s",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "startSound": "Soft Chime",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None",
                  "customPlayId": "cp-fk-test",
                  "customPlayName": "Morning Sit"
                }
                """.formatted(now.minusSeconds(1200), now)))
        .andExpect(status().isOk());

    // Confirm the log references the custom play
    SessionLogEntity before = sessionLogRepository.findById("log-fk-cp").orElseThrow();
    assertThat(before.getCustomPlayId()).isEqualTo("cp-fk-test");
    assertThat(before.getCustomPlayName()).isEqualTo("Morning Sit");

    // Delete the custom play — FK cascade should null custom_play_id
    mockMvc.perform(delete("/api/custom-plays/cp-fk-test"))
        .andExpect(status().is2xxSuccessful());

    // custom_play_id is nulled; name snapshot is retained
    SessionLogEntity after = sessionLogRepository.findById("log-fk-cp").orElseThrow();
    assertThat(after.getCustomPlayId()).isNull();
    assertThat(after.getCustomPlayName()).isEqualTo("Morning Sit");
  }

  @Test
  void deletingPlaylistNullsPlaylistIdButRetainsName() throws Exception {
    // Create a playlist with a timer-based item (no custom play linkage needed)
    mockMvc.perform(put("/api/playlists/pl-fk-test")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "pl-fk-test",
                  "name": "Daily Practice",
                  "items": [
                    {
                      "id": "item-1",
                      "meditationType": "Sahaj",
                      "durationMinutes": 30
                    }
                  ]
                }
                """))
        .andExpect(status().isOk());

    // Log a session referencing the playlist
    Instant now = Instant.now();
    mockMvc.perform(put("/api/session-logs/log-fk-pl")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-fk-pl",
                  "source": "auto log",
                  "status": "completed",
                  "meditationType": "Sahaj",
                  "timerMode": "fixed",
                  "startedAt": "%s",
                  "endedAt": "%s",
                  "intendedDurationSeconds": 1800,
                  "completedDurationSeconds": 1800,
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None",
                  "playlistId": "pl-fk-test",
                  "playlistName": "Daily Practice"
                }
                """.formatted(now.minusSeconds(1800), now)))
        .andExpect(status().isOk());

    // Confirm before state
    SessionLogEntity before = sessionLogRepository.findById("log-fk-pl").orElseThrow();
    assertThat(before.getPlaylistId()).isEqualTo("pl-fk-test");
    assertThat(before.getPlaylistName()).isEqualTo("Daily Practice");

    // Delete the playlist — FK cascade should null playlist_id
    mockMvc.perform(delete("/api/playlists/pl-fk-test"))
        .andExpect(status().is2xxSuccessful());

    // playlist_id is nulled; name snapshot is retained
    SessionLogEntity after = sessionLogRepository.findById("log-fk-pl").orElseThrow();
    assertThat(after.getPlaylistId()).isNull();
    assertThat(after.getPlaylistName()).isEqualTo("Daily Practice");
  }
}
