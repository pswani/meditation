package com.meditation.backend.settings;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
class TimerSettingsControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private TimerSettingsRepository timerSettingsRepository;

  @BeforeEach
  void resetTimerSettings() {
    timerSettingsRepository.save(new TimerSettingsEntity(
        "default",
        20,
        null,
        "None",
        "Temple Bell",
        false,
        5,
        "Temple Bell",
        Instant.parse("2026-03-26T00:00:00Z")
    ));
  }

  @Test
  void returnsSeededTimerSettings() throws Exception {
    mockMvc.perform(get("/api/settings/timer"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("default"))
        .andExpect(jsonPath("$.durationMinutes").value(20))
        .andExpect(jsonPath("$.meditationType").value(""))
        .andExpect(jsonPath("$.intervalEnabled").value(false));
  }

  @Test
  void savesTimerSettings() throws Exception {
    mockMvc.perform(put("/api/settings/timer")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "durationMinutes": 32,
                  "meditationType": "Sahaj",
                  "startSound": "Soft Chime",
                  "endSound": "Temple Bell",
                  "intervalEnabled": true,
                  "intervalMinutes": 8,
                  "intervalSound": "Wood Block"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(32))
        .andExpect(jsonPath("$.meditationType").value("Sahaj"))
        .andExpect(jsonPath("$.intervalEnabled").value(true))
        .andExpect(jsonPath("$.intervalMinutes").value(8));

    mockMvc.perform(get("/api/settings/timer"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(32))
        .andExpect(jsonPath("$.meditationType").value("Sahaj"));
  }

  @Test
  void rejectsInvalidTimerSettings() throws Exception {
    mockMvc.perform(put("/api/settings/timer")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "durationMinutes": 0,
                  "meditationType": "",
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 5,
                  "intervalSound": "Temple Bell"
                }
                """))
        .andExpect(status().isBadRequest());
  }

  @Test
  void ignoresStaleQueuedTimerSettingsWrites() throws Exception {
    mockMvc.perform(put("/api/settings/timer")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2099-03-27T10:15:00Z")
            .content("""
                {
                  "durationMinutes": 32,
                  "meditationType": "Sahaj",
                  "startSound": "Soft Chime",
                  "endSound": "Temple Bell",
                  "intervalEnabled": true,
                  "intervalMinutes": 8,
                  "intervalSound": "Wood Block"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(32));

    mockMvc.perform(put("/api/settings/timer")
            .contentType(APPLICATION_JSON)
            .header("X-Meditation-Sync-Queued-At", "2099-03-27T10:10:00Z")
            .content("""
                {
                  "durationMinutes": 18,
                  "meditationType": "Ajapa",
                  "startSound": "None",
                  "endSound": "None",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(32))
        .andExpect(jsonPath("$.meditationType").value("Sahaj"));
  }
}
