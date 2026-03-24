# ExecPlan: Practice Composition Review Remediation

## 1. Objective
Remediate the critical and important issues identified in `docs/review-practice-composition.md` for Milestone B practice composition, while keeping scope bounded to timer/custom play/playlist/history integration.

## 2. Why
These fixes protect user trust in `session log` continuity and make key actions clearer:
- preserve in-progress timer and playlist run state across refresh/reload interruptions
- prevent silent timer-start failures when a playlist run is active
- improve `history` usability with promised filters and progressive reveal
- tighten stored `session log` validation to reduce malformed-data risk

## 3. Scope
Included:
- active timer and active playlist run persistence + safe rehydration
- recovery-status user messaging
- explicit start-block UX when playlist run is active
- `history` source/status filters and `show more` behavior
- stricter session-log semantic validation at storage load boundary
- focused tests for changed behavior
- decisions and session-handoff updates

Excluded:
- new route additions or navigation IA changes
- backend integration changes
- nice-to-have review findings from prompt 08
- non-Milestone-B feature expansion

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-practice-composition.md`

## 5. Affected files and modules
Expected edits:
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/app/AppShell.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/utils/storage.ts`
- `src/utils/storage.test.ts`
- `src/pages/PracticePage.test.tsx`
- `src/pages/HistoryPage.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- If an active timer or playlist run existed before refresh, the app restores it safely and shows a dismissible recovery banner.
- If restoration is not possible (stale/invalid state), the app clears that state and shows a brief explanatory banner.
- `Start Session` is disabled while a playlist run is active, with clear guidance and resume action.
- `History` supports lightweight filters by `source` and `status`, and progressive reveal via `Show More` while preserving calm layout.

## 7. Data and state model
- Persist active runtime slices in local storage:
  - active timer session + pause flag
  - active playlist run + pause flag
- On app init:
  - validate and normalize loaded active runtime slices
  - recover valid state, clear invalid/stale state, set recovery message
- Strengthen `session log` load validation:
  - valid meditation type enum
  - parseable and ordered timestamps
  - consistent duration bounds

## 8. Risks
- Rehydration logic could create inconsistent countdown state if time math is mishandled.
- Added history controls could introduce test fragility due to duplicate labels.
- Storage validation hardening may drop legacy malformed entries unexpectedly; behavior must remain graceful.

## 9. Milestones
1. Add persistence + normalization helpers for active runtime state and stricter session-log checks.
2. Wire timer context hydration/persistence and recovery messaging.
3. Implement Practice start-block UX and History filters/show-more UX.
4. Add/update focused tests.
5. Run required verification commands.
6. Update decisions/session-handoff and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual sanity checks via component tests for changed UX paths.

## 11. Decision log
- Persist active timer/playlist runtime state with local-first snapshots and explicit pause flags.
- Prefer safe recovery behavior (recover valid snapshots, clear stale snapshots) over speculative catch-up logging.
- Keep history changes lightweight and calm by limiting filters to `source` and `status` plus a simple `Show More` control.
- Strengthen session-log load validation semantically at the storage boundary rather than patching downstream render logic.

## 12. Progress log
- Completed: source docs review and remediation plan definition.
- Completed: milestone 1 (active runtime persistence + session-log semantic validation helpers).
- Completed: milestone 2 (timer context hydration/persistence wiring + recovery messaging surface).
- Completed: milestone 3 (practice start-block UX + history filters/show-more UX).
- Completed: milestone 4 (focused tests updated for storage, practice, and history behavior).
- Completed: milestone 5 (required verification commands all passing).
- Completed: milestone 6 (decisions and session-handoff updates prepared; ready to commit).
