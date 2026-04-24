package com.meditation.backend.sync;

import com.meditation.backend.config.SyncProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Rejects sync mutations whose queued-at timestamp is more than
 * {@code meditation.backend.sync.clock-skew-tolerance-seconds} away from server time.
 * Only fires when the X-Meditation-Sync-Queued-At header is present.
 */
@Component
public class SyncClockSkewInterceptor implements HandlerInterceptor {

  private static final Logger log = LoggerFactory.getLogger(SyncClockSkewInterceptor.class);

  private final SyncProperties syncProperties;

  public SyncClockSkewInterceptor(SyncProperties syncProperties) {
    this.syncProperties = syncProperties;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    String header = request.getHeader(SyncRequestSupport.SYNC_QUEUED_AT_HEADER);
    if (header == null || header.isBlank()) {
      return true;
    }

    Instant syncQueuedAt;
    try {
      syncQueuedAt = Instant.parse(header);
    } catch (DateTimeParseException e) {
      // parseOptionalSyncQueuedAt in SyncRequestSupport will handle the 400 for invalid format
      return true;
    }

    long toleranceSeconds = syncProperties.getClockSkewToleranceSeconds();
    long skewSeconds = Math.abs(syncQueuedAt.getEpochSecond() - Instant.now().getEpochSecond());
    if (skewSeconds > toleranceSeconds) {
      log.warn("Clock skew rejected: skew={}s tolerance={}s header={}",
          skewSeconds, toleranceSeconds, header);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Client clock is too far from server time; drift detected.");
    }

    return true;
  }

  static long computeSkewSeconds(Instant syncQueuedAt, Instant now) {
    return Math.abs(syncQueuedAt.getEpochSecond() - now.getEpochSecond());
  }
}
