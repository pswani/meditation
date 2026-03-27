package com.meditation.backend.settings;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
  public TimerSettingsResponse saveTimerSettings(@RequestBody TimerSettingsUpsertRequest request) {
    return timerSettingsService.saveTimerSettings(request);
  }
}
