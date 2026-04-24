package com.meditation.backend.sync;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "meditation.backend.sync.clock-skew-tolerance-seconds=300")
class SyncClockSkewInterceptorTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void requestWithNoSyncHeaderPassesThrough() throws Exception {
    mockMvc.perform(get("/api/health"))
        .andExpect(status().isOk());
  }

  @Test
  void requestWithHeaderWithinTolerancePassesThrough() throws Exception {
    // Use a read-only endpoint so body/service validation doesn't interfere.
    // The interceptor allows the request through; the health endpoint returns 200.
    String slightlyBehind = Instant.now().minus(60, ChronoUnit.SECONDS).toString();

    mockMvc.perform(get("/api/health")
            .header(SyncRequestSupport.SYNC_QUEUED_AT_HEADER, slightlyBehind))
        .andExpect(status().isOk());
  }

  @Test
  void requestWithHeaderFarInFutureIsRejected() throws Exception {
    String farFuture = Instant.now().plus(10, ChronoUnit.MINUTES).toString();

    mockMvc.perform(get("/api/health")
            .header(SyncRequestSupport.SYNC_QUEUED_AT_HEADER, farFuture))
        .andExpect(status().isBadRequest());
  }

  @Test
  void requestWithHeaderFarInPastIsRejected() throws Exception {
    String farPast = Instant.now().minus(10, ChronoUnit.MINUTES).toString();

    mockMvc.perform(get("/api/health")
            .header(SyncRequestSupport.SYNC_QUEUED_AT_HEADER, farPast))
        .andExpect(status().isBadRequest());
  }

  @Test
  void computeSkewSecondsIsSymmetric() {
    Instant now = Instant.parse("2026-04-24T12:00:00Z");
    Instant ahead = Instant.parse("2026-04-24T12:07:00Z");
    Instant behind = Instant.parse("2026-04-24T11:53:00Z");

    assert SyncClockSkewInterceptor.computeSkewSeconds(ahead, now) == 420;
    assert SyncClockSkewInterceptor.computeSkewSeconds(behind, now) == 420;
  }
}
