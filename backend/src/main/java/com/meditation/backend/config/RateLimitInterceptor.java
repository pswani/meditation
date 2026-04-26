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
