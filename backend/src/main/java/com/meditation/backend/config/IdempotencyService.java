package com.meditation.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyService {

  // Key = X-Idempotency-Key value, Value = serialized response (status + body JSON)
  private final Cache<String, CachedResponse> cache = Caffeine.newBuilder()
      .expireAfterWrite(Duration.ofHours(24))
      .maximumSize(10_000)
      .build();

  public Optional<CachedResponse> get(String key) {
    if (key == null || key.isBlank()) {
      return Optional.empty();
    }
    return Optional.ofNullable(cache.getIfPresent(key));
  }

  public void put(String key, CachedResponse response) {
    if (key != null && !key.isBlank()) {
      cache.put(key, response);
    }
  }

  public record CachedResponse(int status, String body) {}
}
