package com.meditation.backend.sessionlog;

import com.meditation.backend.sync.SyncRequestSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/session-logs")
public class SessionLogController {

  private final SessionLogService sessionLogService;

  public SessionLogController(SessionLogService sessionLogService) {
    this.sessionLogService = sessionLogService;
  }

  @GetMapping
  public SessionLogListResponse listSessionLogs(
      @RequestParam(required = false) String startAt,
      @RequestParam(required = false) String endAt,
      @RequestParam(required = false) String meditationType,
      @RequestParam(required = false) String source,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size
  ) {
    return sessionLogService.listSessionLogs(startAt, endAt, meditationType, source, page, size);
  }

  @PostMapping("/manual")
  public SessionLogResponse createManualSessionLog(@RequestBody ManualSessionLogCreateRequest request) {
    return sessionLogService.createManualSessionLog(request);
  }

  @PutMapping("/{sessionLogId}")
  public SessionLogResponse saveSessionLog(
      @PathVariable String sessionLogId,
      @RequestBody SessionLogUpsertRequest request,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    return sessionLogService.saveSessionLog(sessionLogId, request, syncQueuedAt);
  }
}
