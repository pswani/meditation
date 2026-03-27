package com.meditation.backend.summary;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/summaries")
public class SummaryController {

  private final SummaryService summaryService;

  public SummaryController(SummaryService summaryService) {
    this.summaryService = summaryService;
  }

  @GetMapping
  public SummaryResponse getSummary(
      @RequestParam(required = false) String startAt,
      @RequestParam(required = false) String endAt
  ) {
    return summaryService.getSummary(startAt, endAt);
  }
}
