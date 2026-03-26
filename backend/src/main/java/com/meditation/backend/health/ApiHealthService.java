package com.meditation.backend.health;

import com.meditation.backend.media.MediaStorageService;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class ApiHealthService {

  private final MediaStorageService mediaStorageService;

  public ApiHealthService(MediaStorageService mediaStorageService) {
    this.mediaStorageService = mediaStorageService;
  }

  public ApiHealthResponse currentStatus() {
    return new ApiHealthResponse(
        "ok",
        "meditation-backend",
        Instant.now(),
        mediaStorageService.getMediaRootDirectory().toAbsolutePath().normalize().toString(),
        mediaStorageService.getCustomPlayDirectory().toAbsolutePath().normalize().toString()
    );
  }
}
