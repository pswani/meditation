package com.meditation.backend.sessionlog;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].id").value("log-newer"))
        .andExpect(jsonPath("$[1].id").value("log-older"))
        .andExpect(jsonPath("$[1].customPlayId").value("custom-play-1"));
  }

  @Test
  void createsManualSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(post("/api/session-logs/manual")
            .contentType(APPLICATION_JSON)
            .content("""
                {
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

    mockMvc.perform(get("/api/session-logs"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].source").value("manual log"));
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
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].timerMode").value("open-ended"))
        .andExpect(jsonPath("$[0].intendedDurationSeconds").isEmpty());
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
        .andExpect(jsonPath("$.meditationType").value("Vipassana"))
        .andExpect(jsonPath("$.completedDurationSeconds").value(1200))
        .andExpect(jsonPath("$.status").value("completed"));
  }
}
