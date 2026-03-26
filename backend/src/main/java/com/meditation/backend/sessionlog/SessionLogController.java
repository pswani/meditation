package com.meditation.backend.sessionlog;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/session-logs")
public class SessionLogController {

  private final SessionLogService sessionLogService;

  public SessionLogController(SessionLogService sessionLogService) {
    this.sessionLogService = sessionLogService;
  }

  @GetMapping
  public List<SessionLogResponse> listSessionLogs() {
    return sessionLogService.listSessionLogs();
  }

  @PutMapping("/{sessionLogId}")
  public SessionLogResponse saveSessionLog(
      @PathVariable String sessionLogId,
      @RequestBody SessionLogUpsertRequest request
  ) {
    return sessionLogService.saveSessionLog(sessionLogId, request);
  }
}
