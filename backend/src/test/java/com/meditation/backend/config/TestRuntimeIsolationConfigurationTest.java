package com.meditation.backend.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
class TestRuntimeIsolationConfigurationTest {

  @Autowired
  private Environment environment;

  @Autowired
  private MediaStorageProperties mediaStorageProperties;

  @Test
  void usesInMemoryH2InsteadOfPersistentLocalDataPath() {
    String datasourceUrl = environment.getProperty("spring.datasource.url");

    assertNotNull(datasourceUrl);
    assertTrue(datasourceUrl.startsWith("jdbc:h2:mem:meditation-test-"));
    assertFalse(datasourceUrl.contains("local-data/h2"));
  }

  @Test
  void keepsTestMediaRootInDisposableTempStorage() {
    String configuredMediaRoot = environment.getProperty("meditation.backend.media.root");

    assertNotNull(configuredMediaRoot);
    assertTrue(configuredMediaRoot.contains("meditation-backend-test"));
    assertFalse(configuredMediaRoot.contains("local-data/media"));
    assertTrue(mediaStorageProperties.getRootPath().toString().contains("meditation-backend-test"));
  }
}
