package com.meditation.backend.summary;

import java.util.List;

public record SummaryResponse(
    SummaryOverallResponse overallSummary,
    List<SummaryByTypeResponse> byTypeSummary,
    List<SummaryBySourceResponse> bySourceSummary,
    List<SummaryByTimeOfDayResponse> byTimeOfDaySummary
) {
}
