package com.meditation.backend.sessionlog;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
}
