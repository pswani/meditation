package com.meditation.backend.customplay;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomPlayConcurrentSyncTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private CustomPlayRepository customPlayRepository;

  private static final String CP_ID = "cp-concurrent-test";
  private static final String MEDIA_ASSET_ID = "media-vipassana-sit-20"; // seeded in V2

  @BeforeEach
  void cleanUp() {
    customPlayRepository.deleteAll();
  }

  @Test
  void lateArrivingMutationIsRejectedAsStale() throws Exception {
    // Seed with an initial entity so stale detection can activate.
    performPut(CP_ID, "Initial Play", "2026-01-01T10:00:00Z");

    // Client B arrives first with the later syncQueuedAt → wins, stored updatedAt = 10:02.
    MockHttpServletResponse responseB = performPut(CP_ID, "Updated by B", "2026-01-01T10:02:00Z");
    assertThat(responseB.getHeader("X-Meditation-Sync-Result")).isEqualTo("applied");

    // Client A arrives second with an earlier syncQueuedAt (10:01 < stored 10:02) → stale.
    MockHttpServletResponse responseA = performPut(CP_ID, "Updated by A", "2026-01-01T10:01:00Z");
    assertThat(responseA.getHeader("X-Meditation-Sync-Result")).isEqualTo("stale");

    // The stored entity reflects B's data, not A's.
    CustomPlayEntity stored = customPlayRepository.findById(CP_ID).orElseThrow();
    assertThat(stored.getUpdatedAt().toString()).isEqualTo("2026-01-01T10:02:00Z");
    assertThat(stored.getTitle()).isEqualTo("Updated by B");
  }

  @Test
  void mutationWithLaterSyncQueuedAtWinsOverEarlierOne() throws Exception {
    // Seed with initial entity.
    performPut(CP_ID, "Initial Play", "2026-01-01T10:00:00Z");

    // Client A arrives first with earlier timestamp, gets applied.
    MockHttpServletResponse responseA = performPut(CP_ID, "Updated by A", "2026-01-01T10:01:00Z");
    assertThat(responseA.getHeader("X-Meditation-Sync-Result")).isEqualTo("applied");

    // Client B arrives after with a later timestamp — not stale (10:02 > stored 10:01).
    MockHttpServletResponse responseB = performPut(CP_ID, "Updated by B", "2026-01-01T10:02:00Z");
    assertThat(responseB.getHeader("X-Meditation-Sync-Result")).isEqualTo("applied");

    // B's data wins because it committed last with a later timestamp.
    CustomPlayEntity stored = customPlayRepository.findById(CP_ID).orElseThrow();
    assertThat(stored.getTitle()).isEqualTo("Updated by B");
  }

  private MockHttpServletResponse performPut(String id, String name, String syncQueuedAt)
      throws Exception {
    return mockMvc.perform(
            MockMvcRequestBuilders.put("/api/custom-plays/" + id)
                .contentType(APPLICATION_JSON)
                .header("X-Meditation-Sync-Queued-At", syncQueuedAt)
                .content("""
                    {
                      "id": "%s",
                      "name": "%s",
                      "meditationType": "Vipassana",
                      "durationMinutes": 20,
                      "startSound": "None",
                      "endSound": "Temple Bell",
                      "mediaAssetId": "%s",
                      "recordingLabel": null,
                      "favorite": false
                    }
                    """.formatted(id, name, MEDIA_ASSET_ID)))
        .andReturn()
        .getResponse();
  }
}
