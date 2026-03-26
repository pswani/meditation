package com.meditation.backend.media;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
class MediaAssetControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void returnsSeededCustomPlayMediaCatalog() throws Exception {
    mockMvc.perform(get("/api/media/custom-plays"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$", hasSize(3)))
        .andExpect(jsonPath("$[0].id").value("media-ajapa-breath-15"))
        .andExpect(jsonPath("$[0].filePath").value("/media/custom-plays/ajapa-breath-15.mp3"))
        .andExpect(jsonPath("$[1].id").value("media-tratak-focus-10"))
        .andExpect(jsonPath("$[2].id").value("media-vipassana-sit-20"));
  }

  @Test
  void exposesLocalCorsHeadersForApiRoutes() throws Exception {
    mockMvc.perform(options("/api/media/custom-plays")
            .header("Origin", "http://localhost:5173")
            .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
  }
}
