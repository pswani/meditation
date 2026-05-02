# Session G — Backend: Rate Limiting & Idempotency Keys

## Context

This is a meditation app with a Spring Boot 3.3.4 / Java 21 backend.
Working branch: `review-fixes`. Sessions E and F address validation, schema, and data quality. This session adds two infrastructure-level security features from `CODE-REVIEW-2026-04-24.md`.

Run `./mvnw test` (or `mvn test`) from `backend/` to verify changes.

**Issues addressed (2):**
- B-H8: No rate limiting — a single client can flood POST/PUT/DELETE endpoints
- B-H5: No idempotency tokens — retried mutations can double-apply

These two features are independent and can be implemented in any order, but B-H8 (rate limiting) should come first since it is the higher-priority security control.

---

## B-H8: Per-IP rate limiting with Bucket4j

**Problem:** There is no rate limiting on any endpoint. A misbehaving or buggy client can flood `POST`/`PUT`/`DELETE` endpoints with thousands of requests per second. For a single-user app on a Mac mini this is mainly a resource protection concern, but it also closes a denial-of-service vector.

**Approach:** Add an in-memory per-IP rate limiter using Bucket4j (the standard embedded rate-limiting library for Spring Boot). Apply it to all mutating endpoints via a Spring `HandlerInterceptor`. The bucket capacity chosen (60 mutations per minute per IP) is generous for legitimate app use and tight enough to block a runaway client.

### Files to read first

- `backend/pom.xml` — current dependencies
- `backend/src/main/java/com/meditation/backend/config/WebConfig.java` — current interceptor registration (already has `SyncClockSkewInterceptor`)
- `backend/src/main/java/com/meditation/backend/sync/SyncClockSkewInterceptor.java` — use as a model for the interceptor pattern

### Step 1: Add Bucket4j dependency

In `backend/pom.xml`, inside `<dependencies>`:

```xml
<dependency>
  <groupId>com.bucket4j</groupId>
  <artifactId>bucket4j-core</artifactId>
  <version>8.10.1</version>
</dependency>
```

Use the core module only (no Redis/Hazelcast — we want a local in-memory map).

### Step 2: Create RateLimitInterceptor

Create `backend/src/main/java/com/meditation/backend/config/RateLimitInterceptor.java`:

```java
package com.meditation.backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;

public class RateLimitInterceptor implements HandlerInterceptor {

  private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);

  // 60 mutations per minute per IP, refilling at 1 token/second
  private static final int CAPACITY = 60;
  private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

  private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
      throws Exception {
    String method = request.getMethod();
    if (!isMutatingMethod(method)) {
      return true; // GET and HEAD are never rate-limited
    }

    String clientIp = resolveClientIp(request);
    Bucket bucket = buckets.computeIfAbsent(clientIp, this::newBucket);

    if (bucket.tryConsume(1)) {
      return true;
    }

    log.warn("Rate limit exceeded for IP {} on {} {}", clientIp, method, request.getRequestURI());
    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    response.setContentType("application/json");
    response.getWriter().write(
        "{\"status\":429,\"title\":\"Too Many Requests\",\"detail\":\"Rate limit exceeded. Retry after a moment.\"}");
    return false;
  }

  private boolean isMutatingMethod(String method) {
    return "POST".equalsIgnoreCase(method)
        || "PUT".equalsIgnoreCase(method)
        || "PATCH".equalsIgnoreCase(method)
        || "DELETE".equalsIgnoreCase(method);
  }

  private String resolveClientIp(HttpServletRequest request) {
    // Respect X-Forwarded-For only for the first hop when behind nginx (single proxy)
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private Bucket newBucket(String ip) {
    Bandwidth limit = Bandwidth.builder()
        .capacity(CAPACITY)
        .refillGreedy(CAPACITY, REFILL_PERIOD)
        .build();
    return Bucket.builder().addLimit(limit).build();
  }
}
```

### Step 3: Register the interceptor in WebConfig

In `backend/src/main/java/com/meditation/backend/config/WebConfig.java`, add to `addInterceptors`:

```java
@Bean
public RateLimitInterceptor rateLimitInterceptor() {
  return new RateLimitInterceptor();
}

@Override
public void addInterceptors(InterceptorRegistry registry) {
  // existing SyncClockSkewInterceptor registration
  registry.addInterceptor(syncClockSkewInterceptor()).addPathPatterns("/api/**");

  // Rate limiter on all mutating API calls
  registry.addInterceptor(rateLimitInterceptor()).addPathPatterns("/api/**");
}
```

If `SyncClockSkewInterceptor` is already registered as a `@Bean`, keep the existing pattern and add the rate limiter the same way.

### Step 4: Test

Add `backend/src/test/java/com/meditation/backend/config/RateLimitInterceptorTest.java`:

```java
package com.meditation.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class RateLimitInterceptorTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void requestsUnderLimitAreAllowed() throws Exception {
    // Timer settings PUT is a lightweight mutating endpoint; first request should succeed
    mockMvc.perform(put("/api/timer-settings")
            .contentType("application/json")
            .content("""
                {
                  "timerMode": "fixed",
                  "durationMinutes": 20,
                  "startSound": "None",
                  "endSound": "Temple Bell",
                  "intervalEnabled": false,
                  "intervalMinutes": 0,
                  "intervalSound": "None"
                }
                """))
        .andExpect(status().isOk());
  }
}
```

A full burst test (firing 61 requests) would be flaky in CI due to timing; the unit test above confirms the interceptor is wired and does not block normal traffic.

---

## B-H5: Idempotency key support

**Problem:** `PUT /api/custom-plays/{id}`, `/api/playlists/{id}`, `/api/sankalpas/{id}`, etc. are idempotent by entity ID — a second `PUT` with the same payload and ID is handled correctly. However, if two retries race and arrive simultaneously with different timestamps, one may be applied and one rejected as stale. Clients cannot distinguish "my retry was deduplicated" from "my retry was rejected as stale." Adding an optional `X-Idempotency-Key` header lets clients confirm safe deduplication.

**Approach:** Accept an optional `X-Idempotency-Key` header on all mutating endpoints. Cache `(key → response status + body)` in a short-lived in-memory map (Caffeine, 24 h TTL). On a second request with the same key, return the cached response without re-executing. This is a best-effort server-side guard — clients that do not send the header are unaffected.

**Scope:** Apply to PUT (upsert) endpoints only. DELETE endpoints are already safe to retry after Session E's idempotent-204 fix. POST does not exist on most sync endpoints.

### Files to read first

- `backend/pom.xml` — confirm Caffeine was added in Session E (for the summary cache); if not, add it now
- `backend/src/main/java/com/meditation/backend/config/WebConfig.java`
- `backend/src/main/java/com/meditation/backend/customplay/CustomPlayController.java` — model for controller changes
- `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java` — check if the idempotency header constant belongs here

### Step 1: Add the header constant

In `GeneratedSyncContract.java`, add:

```java
public static final String IDEMPOTENCY_KEY_HEADER = "X-Idempotency-Key";
```

Also add it to the allowed CORS headers in `WebConfig.java`:

```java
.allowedHeaders("Content-Type", "X-Meditation-Sync-Queued-At", "X-Requested-With",
                "X-Idempotency-Key")
```

### Step 2: Create IdempotencyService

Create `backend/src/main/java/com/meditation/backend/config/IdempotencyService.java`:

```java
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
```

### Step 3: Create IdempotencyFilter

Create `backend/src/main/java/com/meditation/backend/config/IdempotencyFilter.java`:

```java
package com.meditation.backend.config;

import com.meditation.backend.sync.GeneratedSyncContract;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
@Order(1)
public class IdempotencyFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(IdempotencyFilter.class);

  private final IdempotencyService idempotencyService;

  public IdempotencyFilter(IdempotencyService idempotencyService) {
    this.idempotencyService = idempotencyService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {

    String idempotencyKey = request.getHeader(GeneratedSyncContract.IDEMPOTENCY_KEY_HEADER);
    boolean isPut = HttpMethod.PUT.matches(request.getMethod());

    if (!isPut || idempotencyKey == null || idempotencyKey.isBlank()) {
      chain.doFilter(request, response);
      return;
    }

    // Return cached response if key was already processed
    var cached = idempotencyService.get(idempotencyKey);
    if (cached.isPresent()) {
      log.debug("Idempotency cache hit for key {}", idempotencyKey);
      response.setStatus(cached.get().status());
      response.setContentType("application/json");
      response.getWriter().write(cached.get().body());
      return;
    }

    // Wrap the response to capture the body for caching
    var wrappedResponse = new ContentCachingResponseWrapper(response);
    chain.doFilter(request, wrappedResponse);

    // Cache the response after the handler completes
    String responseBody = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
    idempotencyService.put(idempotencyKey, new IdempotencyService.CachedResponse(
        wrappedResponse.getStatus(), responseBody));
    wrappedResponse.copyBodyToResponse();
  }
}
```

### Step 4: Test

Add `backend/src/test/java/com/meditation/backend/config/IdempotencyFilterTest.java`:

```java
package com.meditation.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IdempotencyFilterTest {

  @Autowired
  private MockMvc mockMvc;

  private static final String CUSTOM_PLAY_BODY = """
      {
        "id": "cp-idempotency-test",
        "name": "Idempotency Test Play",
        "meditationType": "Vipassana",
        "durationMinutes": 10,
        "startSound": "None",
        "endSound": "Temple Bell",
        "mediaAssetId": "media-vipassana-sit-20",
        "recordingLabel": null,
        "favorite": false
      }
      """;

  @Test
  void secondRequestWithSameIdempotencyKeyReturnsCachedResponse() throws Exception {
    String idempotencyKey = "test-key-" + System.nanoTime();

    MvcResult first = mockMvc.perform(put("/api/custom-plays/cp-idempotency-test")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Idempotency-Key", idempotencyKey)
            .content(CUSTOM_PLAY_BODY))
        .andExpect(status().isOk())
        .andReturn();

    MvcResult second = mockMvc.perform(put("/api/custom-plays/cp-idempotency-test")
            .contentType(MediaType.APPLICATION_JSON)
            .header("X-Idempotency-Key", idempotencyKey)
            .content(CUSTOM_PLAY_BODY))
        .andExpect(status().isOk())
        .andReturn();

    // Both responses must be identical (cached)
    assertThat(second.getResponse().getContentAsString())
        .isEqualTo(first.getResponse().getContentAsString());
  }
}
```

---

## Verification

From `backend/`:
1. Run `./mvnw test` — all tests must pass, including `RateLimitInterceptorTest` and `IdempotencyFilterTest`.
2. Confirm the Bucket4j version resolves without conflict against the Spring Boot BOM.
3. Confirm `X-Idempotency-Key` is in the CORS allowed headers by reviewing the CORS configuration.
4. Confirm the rate limiter does not trigger on GET requests.

## After finishing

Commit on branch `review-fixes`:
```
feat(backend): add per-IP rate limiting and idempotency key support (B-H5, B-H8)
```
