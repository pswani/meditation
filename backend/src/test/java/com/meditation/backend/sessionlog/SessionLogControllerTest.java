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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SessionLogControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private SessionLogRepository sessionLogRepository;

  @BeforeEach
  void clearSessionLogs() {
    sessionLogRepository.deleteAll();
  }

  @Test
  void savesAndListsSessionLogsThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-older")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-older",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T10:20:00Z",
                  "meditationType": "Vipassana",
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
        .andExpect(jsonPath("$.id").value("log-older"))
        .andExpect(jsonPath("$.intendedDurationSeconds").value(1200));

    mockMvc.perform(put("/api/session-logs/log-newer")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-newer",
                  "startedAt": "2026-03-26T11:00:00Z",
                  "endedAt": "2026-03-26T11:12:00Z",
                  "meditationType": "Ajapa",
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
        .andExpect(jsonPath("$[1].id").value("log-older"));
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
  void rejectsInvalidSessionLogPayloads() throws Exception {
    mockMvc.perform(put("/api/session-logs/log-invalid")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "log-invalid",
                  "startedAt": "2026-03-26T10:00:00Z",
                  "endedAt": "2026-03-26T09:59:00Z",
                  "meditationType": "Vipassana",
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
}
