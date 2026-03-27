package com.meditation.backend.customplay;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class CustomPlayControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CustomPlayRepository customPlayRepository;

  @BeforeEach
  void clearCustomPlays() {
    customPlayRepository.deleteAll();
  }

  @Test
  void savesListsAndDeletesCustomPlaysThroughTheApi() throws Exception {
    mockMvc.perform(put("/api/custom-plays/custom-play-1")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "custom-play-1",
                  "name": "Morning Focus",
                  "meditationType": "Vipassana",
                  "durationMinutes": 33,
                  "startSound": "Soft Chime",
                  "endSound": "Wood Block",
                  "mediaAssetId": "media-vipassana-sit-20",
                  "recordingLabel": "Breath emphasis",
                  "favorite": false
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("custom-play-1"))
        .andExpect(jsonPath("$.name").value("Morning Focus"))
        .andExpect(jsonPath("$.mediaAssetId").value("media-vipassana-sit-20"))
        .andExpect(jsonPath("$.recordingLabel").value("Breath emphasis"));

    mockMvc.perform(get("/api/custom-plays"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(1)))
        .andExpect(jsonPath("$[0].name").value("Morning Focus"));

    mockMvc.perform(delete("/api/custom-plays/custom-play-1"))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/custom-plays"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(0)));
  }

  @Test
  void rejectsInvalidLinkedMediaSessionIds() throws Exception {
    mockMvc.perform(put("/api/custom-plays/custom-play-invalid")
            .contentType(APPLICATION_JSON)
            .content("""
                {
                  "id": "custom-play-invalid",
                  "name": "Morning Focus",
                  "meditationType": "Vipassana",
                  "durationMinutes": 33,
                  "startSound": "Soft Chime",
                  "endSound": "Wood Block",
                  "mediaAssetId": "missing-media-asset",
                  "recordingLabel": "",
                  "favorite": false
                }
                """))
        .andExpect(status().isBadRequest());
  }
}
