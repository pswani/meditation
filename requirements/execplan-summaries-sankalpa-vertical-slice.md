# ExecPlan: Summaries + Sankalpa Vertical Slice

## 1. Objective
Implement `summary` and `sankalpa` as one vertical slice with working route-level UX on the `Sankalpa` page, including local persistence, clear counting rules, and focused validation/state logic tests.

## 2. Why
Summaries and sankalpa close the core meditation loop: practice logs become understandable progress, and users can set bounded intentions with measurable tracking. This slice completes a meaningful product journey without adding backend complexity.

## 3. Scope
Included:
- Overall summary derivation from session logs
- By-type summary derivation from session logs
- Sankalpa creation form:
  - duration-based goals
  - session-count-based goals
  - days window
  - optional meditation type filter
  - optional time-of-day bucket filter
- Sankalpa tracking/progress views:
  - active
  - completed
  - expired
- Explicit counting-rule copy in UI
- Local-only persistence for sankalpa goals
- Focused tests for summary derivations and sankalpa counting rules

Excluded:
- backend/cloud sync
- notifications/reminders
- home-page sankalpa snapshot integration
- advanced analytics dashboard
- unrelated refactors in timer/playlists/history flows

## 4. Source documents
- README.md
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/10-summaries-sankalpa.md

## 5. Affected files and modules
- `src/types/sankalpa.ts`
- `src/utils/summary.ts`
- `src/utils/summary.test.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/storage.ts`
- `src/features/timer/timerContextObject.ts`
- `src/features/timer/TimerContext.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/index.css`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- `Sankalpa` page shows:
  - overall summary cards
  - by meditation type summary list
  - sankalpa creation form
  - progress sections for active/completed/expired goals
- Form validation:
  - goal type required
  - target value > 0
  - days > 0
- Optional filters:
  - meditation type
  - time-of-day bucket
- Progress reflects matching `session log` entries within goal window.
- Layout stays calm and readable across phone/tablet/desktop.

## 7. Data and state model
- Add `sankalpa` domain model:
  - goal type (`duration-based` or `session-count-based`)
  - target value
  - days
  - optional meditation type filter
  - optional time-of-day bucket filter
  - created timestamp
- Persist sankalpa goals in localStorage.
- Use full session logs (not only recent subset) for summaries and sankalpa progress.
- Counting rules:
  - source:
    - `auto log` and `manual log` both count
  - session-count sankalpa:
    - each matching session log entry counts as one session
  - duration-based sankalpa:
    - use summed `completedDurationSeconds` from matching logs (proportional partial sessions supported)

## 8. Risks
- Ambiguity around what counts for progress could cause trust issues if not explicit.
- Time-of-day bucket classification can be confusing without clear labels.
- Progress lists may become dense on smaller screens if not carefully structured.

## 9. Milestones
1. Define sankalpa and summary domain helpers + tests.
2. Add sankalpa persistence and expose full session logs in shared context.
3. Implement route-level Sankalpa page with summary + sankalpa flow.
4. Add responsive style refinements and clear empty/validation states.
5. Run verification, update decisions/handoff, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create both goal types
  - verify optional filter behavior
  - confirm status transitions (`active`/`completed`/`expired`)
  - verify summary totals match history logs

## 11. Decision log
- Keep summaries and sankalpa on the existing `Sankalpa` route to avoid navigation sprawl.
- Use local-only persistence and pure derivation helpers for predictable prototype behavior.
- Count both `auto log` and `manual log` by default unless future requirements constrain source types.

## 12. Progress log
- Completed: required-doc review and prompt alignment.
- Completed: sankalpa domain types and summary/sankalpa utility helpers.
- Completed: focused tests for:
  - summary derivations
  - sankalpa validation and counting rules
- Completed: local persistence support for sankalpa goals.
- Completed: route-level `Sankalpa` screen with:
  - overall and by-type summaries
  - sankalpa creation flow
  - active/completed/expired progress sections
  - explicit counting-rule copy
- Completed: responsive layout updates for summary cards and sankalpa progress cards.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: decisions and session handoff updates.
