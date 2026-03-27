package com.meditation.backend.customplay;

import com.meditation.backend.sync.SyncRequestSupport;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/custom-plays")
public class CustomPlayController {

  private final CustomPlayService customPlayService;

  public CustomPlayController(CustomPlayService customPlayService) {
    this.customPlayService = customPlayService;
  }

  @GetMapping
  public List<CustomPlayResponse> listCustomPlays() {
    return customPlayService.listCustomPlays();
  }

  @PutMapping("/{customPlayId}")
  public CustomPlayResponse saveCustomPlay(
      @PathVariable String customPlayId,
      @RequestBody CustomPlayUpsertRequest request,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    return customPlayService.saveCustomPlay(customPlayId, request, syncQueuedAt);
  }

  @DeleteMapping("/{customPlayId}")
  public ResponseEntity<CustomPlayDeleteResult> deleteCustomPlay(
      @PathVariable String customPlayId,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    CustomPlayDeleteResult result = customPlayService.deleteCustomPlay(customPlayId, syncQueuedAt);
    if ("stale".equals(result.outcome())) {
      return ResponseEntity.ok(result);
    }

    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}
