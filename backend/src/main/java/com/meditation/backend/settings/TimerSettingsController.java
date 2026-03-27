package com.meditation.backend.settings;

import com.meditation.backend.sync.SyncRequestSupport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings/timer")
public class TimerSettingsController {

  private final TimerSettingsService timerSettingsService;

  public TimerSettingsController(TimerSettingsService timerSettingsService) {
    this.timerSettingsService = timerSettingsService;
  }

  @GetMapping
  public TimerSettingsResponse getTimerSettings() {
    return timerSettingsService.getTimerSettings();
  }

  @PutMapping
  public TimerSettingsResponse saveTimerSettings(
      @RequestBody TimerSettingsUpsertRequest request,
      @RequestHeader(name = SyncRequestSupport.SYNC_QUEUED_AT_HEADER, required = false) String syncQueuedAt
  ) {
    return timerSettingsService.saveTimerSettings(request, syncQueuedAt);
  }
}
