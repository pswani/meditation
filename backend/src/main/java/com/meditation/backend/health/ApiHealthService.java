package com.meditation.backend.health;

import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class ApiHealthService {

  public ApiHealthResponse currentStatus() {
    return new ApiHealthResponse(
        "ok",
        "meditation-backend",
        Instant.now()
    );
  }
}
