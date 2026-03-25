# Summaries Review

## Scope reviewed
- `Sankalpa` route summary section on `/goals`
- summary range controls (`All time`, `Last 7 days`, `Last 30 days`, `Custom range`)
- summary presentation blocks:
  - overall
  - by meditation type
  - by source
- responsive layout behavior inferred from current page/CSS structure

## Review lens
- clarity
- non-bulky presentation
- comprehension
- responsiveness
- practical usefulness of summary information

## Summary
The summaries slice is directionally strong: the page stays calm, date-range controls are straightforward, and the overall/by-type/by-source sections provide useful visibility. The highest risk is a trust-breaking invalid-range behavior where the UI shows an error but still renders all-time data. After that, the main gaps are missing time-of-day insights and a few comprehension-density refinements.

## Findings

### Critical
1. Invalid custom date range falls back to all-time data while showing an error.
- Evidence:
  - invalid custom range path sets `range` to `{ startAtMs: null, endAtMs: null }` with an error (`src/pages/SankalpaPage.tsx`)
  - summary derivation still runs from that range, which yields all logs (`src/utils/summary.ts`)
- Impact:
  - users see contradictory state (`invalid range` + visible summary numbers)
  - this can undermine trust in summary correctness
- Recommendation:
  - when custom range is invalid, do not render derived summary numbers
  - either show only corrective guidance, or preserve last valid range snapshot explicitly

### Important
1. Time-of-day summary is missing from the summary slice.
- Evidence:
  - product requirements list `summary by time-of-day bucket` under Summaries (`docs/product-requirements.md`)
  - current summary UI includes overall/by-type/by-source only (`src/pages/SankalpaPage.tsx`)
- Impact:
  - users lose one of the most actionable insight cuts for discipline patterns
- Recommendation:
  - add a lightweight `By time of day` section using existing bucket language

2. Source breakdown notation is compact but semantically unclear.
- Evidence:
  - rows use `total (completed/ended early)` number pattern and explain it in a footer line (`src/pages/SankalpaPage.tsx`)
- Impact:
  - users may not immediately understand which value maps to completed vs ended early
  - comprehension friction is higher on quick scans
- Recommendation:
  - label the pair in-row (for example, `completed: X · ended early: Y`) or use compact status pills

### Nice to have
1. By-type rows with zero activity add visual bulk when many categories are inactive.
- Impact:
  - on low-activity users, the list can feel noisier than needed
- Recommendation:
  - add a simple toggle like `Show inactive meditation types`

2. Non-custom range presets do not show explicit boundary dates.
- Impact:
  - users who revisit later may not be certain about exact window boundaries
- Recommendation:
  - keep the preset label, but append a subtle concrete date span for transparency

3. On wider layouts, some summary rows can become text-heavy in side-by-side columns.
- Impact:
  - scanability drops when middle text wraps frequently
- Recommendation:
  - slightly tighten row copy and/or give metric fragments distinct visual hierarchy
