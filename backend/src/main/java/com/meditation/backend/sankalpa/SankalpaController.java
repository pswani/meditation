package com.meditation.backend.sankalpa;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sankalpas")
public class SankalpaController {

  private final SankalpaService sankalpaService;

  public SankalpaController(SankalpaService sankalpaService) {
    this.sankalpaService = sankalpaService;
  }

  @GetMapping
  public List<SankalpaProgressResponse> listSankalpas(@RequestParam(required = false) String timeZone) {
    return sankalpaService.listSankalpas(timeZone);
  }

  @PutMapping("/{sankalpaId}")
  public SankalpaProgressResponse saveSankalpa(
      @PathVariable String sankalpaId,
      @RequestBody SankalpaGoalUpsertRequest request,
      @RequestParam(required = false) String timeZone,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    return sankalpaService.saveSankalpa(sankalpaId, request, timeZone, syncQueuedAt);
  }

  @DeleteMapping("/{sankalpaId}")
  public ResponseEntity<SankalpaDeleteResult> deleteSankalpa(
      @PathVariable String sankalpaId,
      @RequestParam(required = false) String timeZone,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    SankalpaDeleteResult result = sankalpaService.deleteSankalpa(sankalpaId, timeZone, syncQueuedAt);
    if ("stale".equals(result.outcome())) {
      return ResponseEntity.ok(result);
    }

    return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
  }
}
