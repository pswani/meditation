package com.meditation.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class MediaStoragePropertiesTest {

  @Test
  void resolvesValidatedServedDirectoriesWithinRoot() {
    MediaStorageProperties properties = new MediaStorageProperties();
    properties.setRoot("build/test-media-root");
    properties.setCustomPlaySubdirectory("custom-plays");
    properties.setSoundSubdirectory("sounds");

    Path rootPath = properties.getRootPath();

    assertTrue(properties.getCustomPlayDirectoryPath().startsWith(rootPath));
    assertTrue(properties.getSoundDirectoryPath().startsWith(rootPath));
    assertEquals("/media/custom-plays/**", properties.getCustomPlayPublicPathPattern());
    assertEquals("/media/sounds/**", properties.getSoundPublicPathPattern());
  }

  @Test
  void rejectsParentTraversalSubdirectories() {
    MediaStorageProperties properties = new MediaStorageProperties();
    properties.setRoot("build/test-media-root");
    properties.setCustomPlaySubdirectory("../escape");

    IllegalStateException exception = assertThrows(
        IllegalStateException.class,
        properties::getCustomPlayDirectoryPath
    );

    assertTrue(exception.getMessage().contains("custom-play-subdirectory"));
  }

  @Test
  void rejectsNonAbsolutePublicPrefixes() {
    MediaStorageProperties properties = new MediaStorageProperties();
    properties.setPublicPathPrefix("media");

    IllegalStateException exception = assertThrows(
        IllegalStateException.class,
        () -> properties.toPublicPath("custom-plays/demo.mp3")
    );

    assertTrue(exception.getMessage().contains("public-path-prefix"));
  }
}
