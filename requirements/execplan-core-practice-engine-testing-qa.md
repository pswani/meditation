# ExecPlan: Milestone A Targeted Testing and QA Hardening

## 1. Objective
Strengthen Milestone A test coverage and reliability for timer, active-session transitions, session-log creation, Home display derivations, Settings persistence, and critical route behavior.

## 2. Why
Milestone A is the core practice engine. Reliability here directly affects user trust in timer correctness and session-log history.

## 3. Scope
Included:
- Focused test additions/updates for:
  - timer validation rules
  - timer reducer transition rules
  - session-log creation constraints
  - Home quick-start and derived display behavior
  - Settings persistence reflection in practice flow
  - critical route rendering and redirects
  - persistence boundary behavior relevant to current architecture
- Fragile-test cleanup where needed for stability and clarity

Excluded:
- New product features
- Broad refactors
- New backend implementation work
- Non-Milestone A UX redesign

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-a-core-practice-engine/07-test-core-practice-engine.md

## 5. Affected files and modules
- `src/utils/timerValidation.test.ts`
- `src/features/timer/timerReducer.test.ts`
- `src/utils/sessionLog.test.ts`
- `src/pages/HomePage.test.tsx`
- `src/pages/SettingsPage.test.tsx`
- `src/App.test.tsx`
- `src/utils/storage.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No UX behavior changes intended. This pass verifies correctness and continuity of existing Milestone A flows.

## 7. Data and state model
No model changes intended. Tests validate current contracts for:
- timer settings
- active timer transition state
- session-log creation and persistence
- route-level flow continuity

## 8. Risks
- Over-testing implementation details can make suites brittle.
- Time-dependent timer tests may become flaky if based on real clock behavior.
- Route tests can become noisy when duplicate nav controls exist across breakpoints.

## 9. Milestones
1. Audit current tests against prompt coverage targets.
2. Add focused tests for uncovered timer, logging, and routing cases.
3. Tighten persistence-boundary tests for current local-first architecture.
4. Run required verification commands and resolve any regressions.
5. Update decisions and session handoff docs with outcomes and next prompt.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Treat local storage contracts as the current integration boundary because this workspace is front-end only.
- Prefer reducer/helper tests for deterministic timer correctness and keep route tests focused on user-visible continuity.

## 12. Progress log
- Completed: source docs and prompt review.
- Completed: test-gap audit for Milestone A QA targets.
- Completed: targeted test hardening implementation across timer, logs, home, settings, routes, and persistence boundaries.
- Completed: required verification run (`typecheck`, `lint`, `test`, `build`) with all checks passing.
