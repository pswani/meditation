# ExecPlan: Milestone C Summaries Expansion

## 1. Objective
Expand summaries on the `Sankalpa` route to include:
- overall summary
- by meditation type summary
- by source summary
- date-range summary views

## 2. Why
Users need clear, calm insight into practice consistency and quality over meaningful windows, not only all-time totals. Date-range and source segmentation improve trust without adding dashboard clutter.

## 3. Scope
Included:
- Date-range filtering helpers for `session log` data
- Summary derivation additions for `by source`
- Route-level summary controls for range selection
- Responsive summary rendering for phone/tablet/desktop
- Focused tests for summary derivation behavior
- Decisions and handoff updates

Excluded:
- backend/cloud summary service
- chart-heavy analytics dashboard
- sankalpa rule changes
- unrelated route or navigation refactors

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
- prompts/milestone-c-discipline-and-insight/01-implement-summaries.md

## 5. Affected files and modules
- `src/utils/summary.ts`
- `src/utils/summary.test.ts`
- `src/pages/SankalpaPage.tsx`
- `src/index.css`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Summary panel supports range presets:
  - all time
  - last 7 days
  - last 30 days
  - custom date range
- Custom range uses start and end date fields with clear validation guidance.
- Display sections remain calm and scannable:
  - overview cards
  - by meditation type rows
  - by source rows
- Empty states remain explicit and actionable.

## 7. Data and state model
- Keep local-first `session log` source as the summary data input.
- Add pure date-range filter helper that derives a bounded log subset by `endedAt`.
- Derive all summary blocks from the same filtered subset to preserve consistency.
- Keep `source` segmentation aligned with existing domain values:
  - `auto log`
  - `manual log`

## 8. Risks
- Date handling can produce timezone confusion if range boundaries are not clearly inclusive.
- Large summary logic inside JSX could reduce maintainability.
- Additional summary sections might increase visual density on phones if layout is not constrained.

## 9. Milestones
1. Add date-range and by-source helpers in `summary` utilities.
2. Add focused utility tests for new derivation behavior.
3. Integrate date-range controls + summary sections on `Sankalpa` page.
4. Refine responsive styles for summary controls/rows.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - summary values update when switching presets
  - custom range boundaries include expected entries
  - by-source section reports counts/duration correctly
  - layout remains readable on small and large viewports

## 11. Decision log
- Keep summaries on existing `/goals` route for bounded navigation.
- Keep this slice local-first; no backend summary API required in this workspace.
- Use date-range derivation over precomputed aggregates to keep behavior transparent and testable.

## 12. Progress log
- Completed: source-doc review and prompt alignment.
- Completed: summary helper expansion for:
  - by source derivation
  - date-range derivation/filtering
  - reusable summary snapshot composition
- Completed: `Sankalpa` summary UX expansion for:
  - range presets
  - custom date-range controls
  - by-source summary section
- Completed: responsive style refinement for summary controls/sections.
- Completed: focused summary derivation tests (by-source + date-range).
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
