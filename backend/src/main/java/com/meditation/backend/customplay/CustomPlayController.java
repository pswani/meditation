package com.meditation.backend.customplay;

import com.meditation.backend.sync.SyncRequestSupport;
import com.meditation.backend.sync.SyncMutationResult;
import java.util.List;
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
  public ResponseEntity<CustomPlayResponse> saveCustomPlay(
      @PathVariable String customPlayId,
      @RequestBody CustomPlayUpsertRequest request,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    SyncMutationResult<CustomPlayResponse> result = customPlayService.saveCustomPlay(customPlayId, request, syncQueuedAt);
    return SyncRequestSupport.mutationResponse(result);
  }

  @DeleteMapping("/{customPlayId}")
  public ResponseEntity<CustomPlayDeleteResult> deleteCustomPlay(
      @PathVariable String customPlayId,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    CustomPlayDeleteResult result = customPlayService.deleteCustomPlay(customPlayId, syncQueuedAt);
    return SyncRequestSupport.deleteResponse(result.outcome(), result);
  }
}
