package com.meditation.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdempotencyFilterTest {

  @Autowired
  private MockMvc mockMvc;

  private static final String CUSTOM_PLAY_BODY = """
      {
        "id": "cp-idempotency-test",
        "name": "Idempotency Test Play",
        "meditationType": "Vipassana",
        "durationMinutes": 10,
        "startSound": "None",
        "endSound": "Temple Bell",
        "mediaAssetId": "media-vipassana-sit-20",
        "recordingLabel": null,
        "favorite": false
      }
      """;

  @Test
  void secondRequestWithSameIdempotencyKeyReturnsCachedResponse() throws Exception {
    String idempotencyKey = "test-key-" + System.nanoTime();

    MvcResult first = mockMvc.perform(put("/api/custom-plays/cp-idempotency-test")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Idempotency-Key", idempotencyKey)
            .content(CUSTOM_PLAY_BODY))
        .andExpect(status().isOk())
        .andReturn();

    MvcResult second = mockMvc.perform(put("/api/custom-plays/cp-idempotency-test")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Idempotency-Key", idempotencyKey)
            .content(CUSTOM_PLAY_BODY))
        .andExpect(status().isOk())
        .andReturn();

    // Both responses must be identical (cached)
    assertThat(second.getResponse().getContentAsString())
        .isEqualTo(first.getResponse().getContentAsString());
  }
}
