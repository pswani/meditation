package com.meditation.backend.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.NONE,
    properties = {
        "spring.datasource.url=jdbc:h2:mem:backend-config-dev;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
    }
)
@ActiveProfiles("dev")
class DevRuntimeConfigurationTest {

  @Autowired
  private Environment environment;

  @Test
  void enablesH2ConsoleForDevProfile() {
    assertTrue(Boolean.TRUE.equals(environment.getProperty("spring.h2.console.enabled", Boolean.class)));
  }
}
