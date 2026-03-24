# Manual Logging Review

## Scope reviewed
- `History` manual log entry flow
- manual log validation and data integrity
- manual log and auto log list integration in `History`
- minimum supporting recency behavior for unified session log history

## Summary
The current manual logging flow is close to usable, but there are trust-impacting correctness gaps in timestamp handling and a recency-order mismatch in history. These issues can make saved entries appear at the wrong time window or fail unexpectedly on malformed input.

## Findings

### Critical
1. `Session timestamp` semantics are inverted in manual log entry construction.
- Current behavior treats the entered timestamp as `startedAt` and derives `endedAt` by adding duration.
- UI helper text explicitly says the timestamp is when the session ended.
- Impact:
  - manual entries are shifted forward by their full duration
  - downstream summaries/history timing interpretation is inaccurate

2. Manual timestamp validation accepts malformed values.
- Current validation only checks for non-empty text.
- Invalid timestamp strings can reach entry construction and produce invalid date handling at runtime.
- Impact:
  - potential runtime failure during save
  - poor error recovery for user-entered or programmatically injected invalid values

### Important
1. History recency ordering is insertion-based rather than ended-time-based.
- Backfilled manual logs from older dates are inserted at the top and appear as newest.
- Impact:
  - `Recent Session Logs` ordering can be misleading
  - manual and auto logs are not presented in true recency order

### Nice to have
1. Add a focused inline hint when a timestamp is invalid (in addition to required-state validation copy).
2. Add explicit tests for mixed-source recency ordering across manual and auto logs.
