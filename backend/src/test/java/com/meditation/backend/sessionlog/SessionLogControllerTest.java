package com.meditation.backend.sessionlog;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.meditation.backend.customplay.CustomPlayRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SessionLogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @Autowired
  private CustomPlayRepository customPlayRepository;

  @BeforeEach
  void clearSessionLogs() {
    sessionLogRepository.deleteAll();
    customPlayRepository.deleteAll();
  }

  @Test
  void savesAndListsSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/custom-plays/custom-play-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "custom-play-1",
                  "name": "Morning Focus",
                  "meditationType": "Vipassana",
                  "durationMinutes": 20,
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "mediaAssetId": "media-vipassana-sit-20",
                  "recordingLabel": "Breath emphasis",
                  "favorite": false
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/session-logs/log-older")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-older",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None",
                  "customPlayId": "custom-play-1",
                  "customPlayName": "Morning Focus",
                  "customPlayRecordingLabel": "Breath emphasis"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("log-older"))
        .andExpect(jsonPath("$.timerMode").value("fixed"))
        .andExpect(jsonPath("$.intendedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.customPlayName").value("Morning Focus"));

    mockMvc.perform(put("/api/session-logs/log-newer")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-newer",
                  "startedAt": "2026-03-26T11:00:00Z",
                  "endedAt": "2026-03-26T11:12:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 900,
                  "completedDurationSeconds": 720,
                  "status": "ended early",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.page").value(0))
        .andExpect(jsonPath("$.size").value(2))
        .andExpect(jsonPath("$.totalItems").value(2))
        .andExpect(jsonPath("$.hasNextPage").value(false))
        .andExpect(jsonPath("$.items[0].id").value("log-newer"))
        .andExpect(jsonPath("$.items[1].id").value("log-older"))
        .andExpect(jsonPath("$.items[1].customPlayId").value("custom-play-1"));
  }

  @Test
  void createsManualSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(post("/api/session-logs/manual")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "timerMode": "fixed",
                  "durationMinutes": 12,
                  "meditationType": "Ajapa",
                  "sessionTimestamp": "2026-03-26T11:12:00Z"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.source").value("manual log"))
        .andExpect(jsonPath("$.status").value("completed"))
        .andExpect(jsonPath("$.timerMode").value("fixed"))
        .andExpect(jsonPath("$.intendedDurationSeconds").value(720))
        .andExpect(jsonPath("$.completedDurationSeconds").value(720))
        .andExpect(jsonPath("$.startedAt").value("2026-03-26T11:00:00Z"))
        .andExpect(jsonPath("$.endedAt").value("2026-03-26T11:12:00Z"));

    mockMvc.perform(post("/api/session-logs/manual")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "timerMode": "open-ended",
                  "durationMinutes": 18,
                  "meditationType": "Vipassana",
                  "sessionTimestamp": "2026-03-26T12:18:00Z"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.source").value("manual log"))
        .andExpect(jsonPath("$.status").value("completed"))
        .andExpect(jsonPath("$.timerMode").value("open-ended"))
        .andExpect(jsonPath("$.intendedDurationSeconds").isEmpty())
        .andExpect(jsonPath("$.completedDurationSeconds").value(1080))
        .andExpect(jsonPath("$.startedAt").value("2026-03-26T12:00:00Z"))
        .andExpect(jsonPath("$.endedAt").value("2026-03-26T12:18:00Z"));

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].timerMode").value("open-ended"))
        .andExpect(jsonPath("$.items[1].source").value("manual log"));
  }

  @Test
  void defaultsManualSessionLogsToFixedWhenTimerModeIsOmitted() throws Exception {
    mockMvc.perform(post("/api/session-logs/manual")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "durationMinutes": 10,
                  "meditationType": "Ajapa",
                  "sessionTimestamp": "2026-03-26T10:10:00Z"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.timerMode").value("fixed"))
        .andExpect(jsonPath("$.intendedDurationSeconds").value(600))
        .andExpect(jsonPath("$.completedDurationSeconds").value(600));
  }

  @Test
  void allowsMeditationTypeOnlyEditsForExistingManualLogs() throws Exception {
    mockMvc.perform(put("/api/session-logs/manual-log-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "manual-log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.meditationType").value("Vipassana"));

    mockMvc.perform(put("/api/session-logs/manual-log-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "manual-log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.meditationType").value("Ajapa"))
        .andExpect(jsonPath("$.completedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.status").value("completed"));
  }

  @Test
  void rejectsMeditationTypeChangesForExistingAutoLogs() throws Exception {
    mockMvc.perform(put("/api/session-logs/auto-log-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "auto-log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/session-logs/auto-log-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "auto-log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].meditationType").value("Vipassana"));
  }

  @Test
  void rejectsBroaderRewritesForExistingManualLogs() throws Exception {
    mockMvc.perform(put("/api/session-logs/manual-log-2")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "manual-log-2",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/session-logs/manual-log-2")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "manual-log-2",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 900,
                  "status": "ended early",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].meditationType").value("Vipassana"))
        .andExpect(jsonPath("$.items[0].completedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.items[0].status").value("completed"));
  }

  @Test
  void savesOpenEndedSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-open-ended")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-open-ended",
                  "startedAt": "2026-03-26T11:00:00Z",
                  "endedAt": "2026-03-26T11:18:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "open-ended",
                  "intendedDurationSeconds": null,
                  "completedDurationSeconds": 1080,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "Soft Chime",
                  "endSound": "Temple Bell",
                  "intervalEnabled": true,
                  "intervalMinutes": 9,
                  "intervalSound": "Wood Block"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("log-open-ended"))
        .andExpect(jsonPath("$.timerMode").value("open-ended"))
        .andExpect(jsonPath("$.intendedDurationSeconds").isEmpty())
        .andExpect(jsonPath("$.completedDurationSeconds").value(1080))
        .andExpect(jsonPath("$.status").value("completed"));

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.items[0].timerMode").value("open-ended"))
        .andExpect(jsonPath("$.items[0].intendedDurationSeconds").isEmpty());
  }

  @Test
  void savesFixedCompletedSessionLogsWhenActualPracticeRunsPastThePlannedDuration() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-deferred-complete")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-deferred-complete",
                  "startedAt": "2026-03-26T11:00:00Z",
                  "endedAt": "2026-03-26T11:25:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1500,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("log-deferred-complete"))
        .andExpect(jsonPath("$.intendedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.completedDurationSeconds").value(1500));
  }

  @Test
  void savesSessionLogsEvenWhenReferencedCustomPlayOrPlaylistAreMissing() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-missing-library-records")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-missing-library-records",
                  "startedAt": "2026-03-26T11:00:00Z",
                  "endedAt": "2026-03-26T11:18:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1080,
                  "completedDurationSeconds": 1080,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None",
                  "playlistId": "deleted-playlist-1",
                  "playlistName": "Deleted playlist",
                  "playlistRunId": "playlist-run-1",
                  "customPlayId": "deleted-custom-play-1",
                  "customPlayName": "Deleted custom play",
                  "customPlayRecordingLabel": "Saved recording label"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("log-missing-library-records"))
        // IDs are nulled when the referenced entity no longer exists (FK ON DELETE SET NULL semantics);
        // name snapshots are always retained for display.
        .andExpect(jsonPath("$.playlistId").doesNotExist())
        .andExpect(jsonPath("$.customPlayId").doesNotExist())
        .andExpect(jsonPath("$.customPlayName").value("Deleted custom play"));
  }

  @Test
  void filtersAndPaginatesSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-1",
                  "startedAt": "2026-03-26T08:00:00Z",
                  "endedAt": "2026-03-26T08:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/session-logs/log-2")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-2",
                  "startedAt": "2026-03-26T09:00:00Z",
                  "endedAt": "2026-03-26T09:10:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 600,
                  "completedDurationSeconds": 600,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/session-logs/log-3")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-3",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:15:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 900,
                  "completedDurationSeconds": 900,
                  "status": "completed",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/session-logs")
            .queryParam("startAt", "2026-03-26T08:30:00Z")
            .queryParam("endAt", "2026-03-26T10:00:00Z")
            .queryParam("meditationType", "Vipassana")
            .queryParam("source", "auto log")
            .queryParam("page", "0")
            .queryParam("size", "1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items", hasSize(1)))
        .andExpect(jsonPath("$.items[0].id").value("log-2"))
        .andExpect(jsonPath("$.page").value(0))
        .andExpect(jsonPath("$.size").value(1))
        .andExpect(jsonPath("$.totalItems").value(1))
        .andExpect(jsonPath("$.hasNextPage").value(false));
  }

  @Test
  void rejectsInvalidSessionLogListQueryParameters() throws Exception {
    mockMvc.perform(get("/api/session-logs")
            .queryParam("page", "-1")
            .queryParam("size", "50"))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/session-logs")
            .queryParam("source", "queued log"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void rejectsInvalidSessionLogPayloads() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-invalid")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-invalid",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T09:59:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isBadRequest());

    mockMvc.perform(put("/api/session-logs/log-invalid-ended-early-duration")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-invalid-ended-early-duration",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:25:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1500,
                  "status": "ended early",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void rejectsInvalidManualSessionLogPayloads() throws Exception {
    mockMvc.perform(post("/api/session-logs/manual")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "durationMinutes": 0,
                  "meditationType": "",
                  "sessionTimestamp": "invalid"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void ignoresStaleQueuedSessionLogRetries() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-1")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2026-03-27T10:15:00Z")
            .content("""
                {
                  "id": "log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 1200,
                  "status": "completed",
                  "source": "auto log",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(header().string("X-Meditation-Sync-Result", "applied"))
        .andExpect(jsonPath("$.meditationType").value("Vipassana"));

    mockMvc.perform(put("/api/session-logs/log-1")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2026-03-27T10:10:00Z")
            .content("""
                {
                  "id": "log-1",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Ajapa",
                  "timerMode": "fixed",
                  "intendedDurationSeconds": 1200,
                  "completedDurationSeconds": 600,
                  "status": "ended early",
                  "source": "manual log",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(header().string("X-Meditation-Sync-Result", "stale"))
        .andExpect(jsonPath("$.meditationType").value("Vipassana"))
        .andExpect(jsonPath("$.completedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.status").value("completed"));
  }
}
