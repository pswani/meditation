# Manual Logging Review

## Scope reviewed
- `History` manual log entry flow
- manual log validation clarity
- history integration of manual and auto entries
- responsive behavior across phone, tablet, and desktop layouts
- manual vs auto distinction clarity

## Review lens
- calmness and low-friction interaction
- validation quality
- data integrity
- responsive readability

## Summary
The manual logging slice is now functionally solid: timestamp semantics are aligned to helper text, malformed timestamp input is blocked, and mixed-source recency ordering in `Recent Session Logs` is correct. Remaining gaps are mostly around guardrails for data quality and history analysis ergonomics.

## Findings

### Critical
None identified in this review pass.

### Important
1. Manual logs allow future session timestamps with no guardrail.
- Current behavior accepts any valid datetime-local value, including future times.
- Impact:
  - future logs can inflate today/goal metrics and reduce trust in summary accuracy
  - accidental future-date selection is hard to detect once mixed into history
- Recommendation:
  - block manual `session timestamp` values later than `now` (or require explicit confirmation)
  - add clear validation copy: `Session timestamp cannot be in the future.`

2. Session log load path lacks shape validation for stored entries.
- Current storage loading trusts array entries without validating required `session log` fields.
- Impact:
  - malformed localStorage payloads can enter runtime state and produce degraded history rendering (`Invalid Date`, missing metadata)
  - data integrity boundaries are weaker than timer settings boundaries, which already validate shape
- Recommendation:
  - add a minimal `isSessionLog` guard when loading stored logs
  - discard malformed entries while preserving valid items

### Nice to have
1. Add lightweight history filters for `source` and `status`.
- Rationale:
  - manual vs auto badges are present, but filtering improves scanability as logs grow
  - aligns with `History` screen inventory expectation (`recent logs`, `filters`, manual vs auto badges)

2. Add post-save focus/scroll behavior to the newest saved manual entry.
- Rationale:
  - success banner confirms save, but locating the new row in long histories still takes effort
