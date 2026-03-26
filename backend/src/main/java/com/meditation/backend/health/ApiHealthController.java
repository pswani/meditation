package com.meditation.backend.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class ApiHealthController {

  private final ApiHealthService apiHealthService;

  public ApiHealthController(ApiHealthService apiHealthService) {
    this.apiHealthService = apiHealthService;
  }

  @GetMapping
  public ApiHealthResponse getHealth() {
    return apiHealthService.currentStatus();
  }
}
