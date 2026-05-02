package com.meditation.backend.config;

import com.meditation.backend.sync.SyncRequestSupport;
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

    String idempotencyKey = request.getHeader(SyncRequestSupport.IDEMPOTENCY_KEY_HEADER);
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
