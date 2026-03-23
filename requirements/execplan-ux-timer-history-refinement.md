# ExecPlan: UX Refinement for Timer + Active Timer + History

## 1. Objective
Implement the critical and important UX improvements identified in `docs/ux-review-timer-history.md` for the `Timer Setup`, `Active Timer`, and `History` screens.

## 2. Why
This improves trust, clarity, and responsiveness for the first complete meditation flow while preserving existing timer and auto log behavior.

## 3. Scope
Included:
- `End Early` confirmation interaction.
- Advanced grouping for optional timer controls.
- Explicit interval sound selector when interval bell is enabled.
- Progressive validation visibility on setup form.
- Stronger paused and completion hierarchy in active timer.
- Improved history readability on tablet/desktop.
- Actionable history empty-state CTA.

Excluded:
- manual log
- summary
- sankalpa features
- custom plays
- playlists
- backend or cloud sync
- notification features

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-timer-history.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

## 5. Affected files and modules
- `src/pages/PracticePage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/features/timer/*` (settings/session model updates if needed)
- `src/types/*`
- `src/utils/*`
- `src/index.css`
- focused tests for changed behavior
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Setup keeps duration and meditation type clear first, with optional controls in collapsed advanced section.
- End early requires explicit confirmation.
- Active timer clearly shows paused/running state and clearer completion messaging.
- History keeps statuses clear and improves scanability on larger screens.
- Empty history state offers direct action to start session.

## 7. Data and state model
- Extend timer settings to include interval sound selection.
- Maintain existing local-only persistence model and auto log behavior.
- Add local UI state for progressive validation visibility and end-early confirmation.

## 8. Risks
- Regressing existing start/pause/resume/end behavior while changing UI state flow.
- Over-styling and losing calm/minimal design.
- Introducing new validation confusion during progressive validation.

## 9. Milestones
1. Update timer settings/session log models for interval sound.
2. Implement Timer Setup UX refinements (advanced section + progressive validation).
3. Implement Active Timer UX refinements (paused hierarchy + end confirmation + completion copy).
4. Implement History readability + empty-state CTA improvements.
5. Update/add focused tests.
6. Update decisions/session-handoff and verify.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - End early confirmation requires explicit final action.
  - Advanced section is collapsed by default.
  - Interval sound selector appears when interval bell is enabled.
  - Setup errors are shown progressively.
  - History empty state includes start-session action.
  - History metadata is easier to scan on tablet/desktop.

## 11. Decision log
- Keep this as UX-only refinement and preserve core timer and auto log mechanics.
- Keep mock sound options for consistency with prototype scope.

## 12. Progress log
- Completed: prompt and document review.
- In progress: implementation.
