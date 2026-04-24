package com.meditation.backend.error;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
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
class GlobalExceptionHandlerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void responseStatusExceptionPreservesStatusAndReturnsProblemDetail() throws Exception {
    // CustomPlayService throws ResponseStatusException(400) for invalid payloads.
    // Sending a missing required field triggers this path.
    mockMvc.perform(put("/api/custom-plays/play-1")
            .contentType(APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.detail").isString())
        .andExpect(jsonPath("$.title").isString());
  }

  @Test
  void responseBodyDoesNotContainStackTrace() throws Exception {
    mockMvc.perform(put("/api/custom-plays/play-1")
            .contentType(APPLICATION_JSON)
            .content("{}"))
        .andExpect(jsonPath("$.detail").value(not(containsString("Exception"))));
  }

  @Test
  void malformedJsonBodyReturns400WithGenericMessage() throws Exception {
    mockMvc.perform(put("/api/custom-plays/play-1")
            .contentType(APPLICATION_JSON)
            .content("not-json{{{{"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.detail").value("Malformed request body"));
  }

  @Test
  void unknownEndpointReturns404() throws Exception {
    mockMvc.perform(get("/api/does-not-exist-xyz"))
        .andExpect(status().isNotFound());
  }
}
