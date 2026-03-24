# Discipline and Insight Review

## Scope reviewed
- Milestone C summaries on `/goals`:
  - overall summary
  - by meditation type
  - by source
  - by time of day
  - date-range controls
- Milestone C sankalpa flow on `/goals`:
  - creation form
  - optional filters
  - active/completed/expired progress sections
- responsive behavior inferred from current page/CSS implementation for:
  - mobile
  - tablet
  - desktop

## Review lens
- clarity
- comprehension
- non-bulky presentation
- multi-device usability

## Summary
Milestone C is functionally complete and coherent: summaries and sankalpa tracking work together on a single route, with clear foundational rules and responsive baseline behavior. The main remaining risk is data-trust perception in zero-value duration display, followed by presentation density and some ambiguous metric labeling.

## Findings

### Critical
1. Zero-duration summary entries are displayed as `< 1 min`, which reads as non-zero progress.
- Evidence:
  - duration formatting returns `< 1 min` for all values under 60 seconds (`src/utils/sessionLog.ts:29-32`)
  - summary sections render this for zero-value rows in by-type and by-time-of-day (`src/pages/SankalpaPage.tsx:342-376`)
- Impact:
  - users can read inactive categories as having non-zero activity
  - this weakens trust in summary accuracy, especially in low-activity states
- Recommendation:
  - render exact zero as `0 min`
  - keep `< 1 min` only for truly non-zero sub-minute durations

### Important
1. Summary density is high on mobile because low-signal zero rows are always shown.
- Evidence:
  - by meditation type and by time of day always render full lists (`src/pages/SankalpaPage.tsx:342-378`)
- Impact:
  - the page feels long and busy on phones, reducing scanability of meaningful data
- Recommendation:
  - add a lightweight toggle to hide zero rows by default (`Show inactive categories`)

2. Overall “Completed vs ended early” card uses unlabeled `X / Y` shorthand.
- Evidence:
  - card value shows two numbers separated by slash (`src/pages/SankalpaPage.tsx:327-334`)
- Impact:
  - users must infer which side is completed vs ended early
  - quick comprehension is weaker than the explicit by-source row style
- Recommendation:
  - switch to explicit labels in-card (`completed: X · ended early: Y`)

3. Tablet row layout can become text-heavy in summary lists.
- Evidence:
  - tablet+ rows force three columns with two `auto` columns (`src/index.css:931-935`)
  - by-source middle text is verbose (`src/pages/SankalpaPage.tsx:358-361`)
- Impact:
  - wraps and crowding reduce readability on medium widths
- Recommendation:
  - allow the middle metric column to flex, or use compact pills/stacking on medium screens

### Nice to have
1. Sankalpa sections are sorted by created date, not urgency.
- Evidence:
  - sort order uses `createdAt` descending (`src/pages/SankalpaPage.tsx:222-225`)
- Recommendation:
  - sort active goals by nearest deadline first to improve actionability

2. Preset date ranges do not show explicit boundary dates.
- Evidence:
  - labels for last-7 and last-30 are generic (`src/pages/SankalpaPage.tsx:81-88`, `294`)
- Recommendation:
  - append subtle concrete range boundaries for transparency

3. Desktop space is underused in the summary sections area.
- Evidence:
  - summary cards expand to four columns on large screens, but summary sections stay at two columns (`src/index.css:911-917`, `995-997`)
- Recommendation:
  - consider a three-column summary-sections layout at large breakpoints
