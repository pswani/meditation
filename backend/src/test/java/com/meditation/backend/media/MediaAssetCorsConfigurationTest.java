package com.meditation.backend.media;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = "meditation.backend.cors.allowed-origin-patterns[0]=http://192.168.1.25:5173"
)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaAssetCorsConfigurationTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void exposesConfiguredCorsHeadersForApiRoutes() throws Exception {
    mockMvc.perform(options("/api/media/custom-plays")
            .header("Origin", "http://192.168.1.25:5173")
            .header("Access-Control-Request-Method", "GET"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://192.168.1.25:5173"));
  }
}
