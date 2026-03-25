# ExecPlan: Milestone C Discipline and Insight Remediation

## 1. Objective
Fix the critical and important Milestone C review findings for summaries and sankalpa usability on `/goals` without expanding beyond this feature area.

## 2. Why
The review identified trust and clarity issues in summary presentation that can make users question correctness and increase scan effort, especially on phone/tablet layouts.

## 3. Scope
Included:
- Zero-duration display correction in summary duration labels
- Summary density reduction for by-type and by-time-of-day lists via inactive-row toggle
- Explicit overall-card labeling for completed vs ended-early counts
- Medium-breakpoint readability improvements for summary list rows (especially by-source)
- Focused tests for changed behavior
- Required doc updates and verification commands

Excluded:
- Nice-to-have review items
- New navigation, new routes, or backend integration
- Unrelated timer/history/custom-play/playlist refactors

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md
- docs/review-discipline-and-insight.md
- prompts/milestone-c-discipline-and-insight/06-fix-discipline-and-insight-review-findings.md

## 5. Affected files and modules
- `src/pages/SankalpaPage.tsx`
- `src/index.css`
- `src/utils/sessionLog.ts`
- `src/pages/SankalpaPage.test.tsx`
- `src/utils/sessionLog.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Zero durations are rendered as `0 min`.
- Sub-minute non-zero durations remain `\< 1 min`.
- By meditation type and by time of day hide inactive categories by default.
- Users can reveal inactive categories via `Show inactive categories` toggle.
- Overall summary card uses explicit labels for completion split.
- Summary row layout remains calm/readable on tablet widths with compact in-row metrics for by-source.

## 7. Data and state model
- No domain model changes.
- Add local UI state on Sankalpa page for inactive-category visibility in summary lists.
- Summary derivation logic remains unchanged; filtering is presentation-layer only.

## 8. Risks
- New toggle default could hide expected rows for users used to full category coverage.
- Label copy changes may require test selector updates where text was previously shorthand.
- CSS changes can unintentionally affect other summary list sections if class scoping is too broad.

## 9. Milestones
1. Add/record ExecPlan and map each critical/important finding to concrete code changes.
2. Implement summary behavior and copy fixes in `SankalpaPage`.
3. Implement style refinements for medium breakpoint summary readability.
4. Update focused tests for duration formatting and Sankalpa summary UX.
5. Run typecheck/lint/test/build and fix regressions.
6. Update decisions + session handoff and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual check of `/goals` summary behavior for:
  - zero durations
  - inactive toggle
  - explicit completion labels
  - tablet readability

## 11. Decision log
- Keep summary derivation full-coverage and apply inactive filtering only in presentation to preserve insight completeness.
- Keep remediation bounded to critical/important findings from the review document.

## 12. Progress log
- Completed: reviewed required docs, review findings, and current summary implementation.
- Completed: implemented summary UX remediation in `SankalpaPage`:
  - explicit overall completed/ended-early labels
  - inactive category toggle for by-type and by-time-of-day sections
  - filtered inactive rows by default while preserving full summary derivation.
- Completed: adjusted summary styling in `src/index.css` for medium-breakpoint readability and compact by-source metrics.
- Completed: fixed duration formatting trust issue in `formatDurationLabel`:
  - `0 min` for exact zero
  - `\< 1 min` only for strictly positive sub-minute durations.
- Completed: added focused tests:
  - `src/pages/SankalpaPage.test.tsx`
  - `src/utils/sessionLog.test.ts`
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
