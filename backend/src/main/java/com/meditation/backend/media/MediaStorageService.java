package com.meditation.backend.media;

import com.meditation.backend.config.MediaStorageProperties;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class MediaStorageService {

  private final MediaStorageProperties mediaStorageProperties;

  public MediaStorageService(MediaStorageProperties mediaStorageProperties) {
    this.mediaStorageProperties = mediaStorageProperties;
  }

  @PostConstruct
  void initializeDirectories() {
    createDirectory(mediaStorageProperties.getRootPath());
    createDirectory(mediaStorageProperties.getCustomPlayDirectoryPath());
    createDirectory(mediaStorageProperties.getSoundDirectoryPath());
  }

  public Path getMediaRootDirectory() {
    return mediaStorageProperties.getRootPath();
  }

  public Path getCustomPlayDirectory() {
    return mediaStorageProperties.getCustomPlayDirectoryPath();
  }

  public Path getSoundDirectory() {
    return mediaStorageProperties.getSoundDirectoryPath();
  }

  private void createDirectory(Path path) {
    try {
      Files.createDirectories(path);
    } catch (IOException exception) {
      throw new IllegalStateException("Unable to initialize media storage directory: " + path, exception);
    }
  }
}
