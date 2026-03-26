package com.meditation.backend.settings;

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
class TimerSettingsControllerTest {

  @Autowired
  private MockMvc mockMvc;

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
}
