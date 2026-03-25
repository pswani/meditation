# ExecPlan: Milestone D Production-Readiness Testing Hardening

## 1. Objective
Strengthen test coverage and reliability for critical cross-app flows and persistence/recovery behavior as the app moves into Milestone D production-readiness work.

## 2. Why
This app’s trust depends on reliable timer, logging, playlist, and recovery behavior. Production-readiness QA should focus on the load-bearing flows that are easiest to regress and hardest for users to forgive.

## 3. Scope
Included:
- Targeted test-gap audit across route-level flows, timer/playlists state continuity, and persistence boundaries
- Focused test additions for:
  - persisted timer recovery
  - persisted playlist-run recovery and run controls
  - playlist start blocking and continuation UX
  - playlist-run logging outcomes
- Reliability-oriented test patterns where needed for deterministic time-sensitive behavior
- Required verification and handoff doc updates

Excluded:
- New product features
- Broad refactors unrelated to QA confidence
- Backend implementation beyond existing local-first REST-style boundary coverage
- Visual redesign or accessibility polish work

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
- prompts/milestone-d-production-readiness/01-testing-hardening.md

## 5. Affected files and modules
- `src/App.test.tsx`
- `src/pages/PlaylistsPage.test.tsx`
- `src/pages/PlaylistRunPage.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No intended product-behavior changes. This slice verifies that current UX remains trustworthy when:
- the app rehydrates persisted active state
- playlist starts are blocked by active timer state
- active playlist runs can be resumed and ended safely
- ended-early playlist progress produces visible outcome/history continuity

## 7. Data and state model
No model changes intended. Tests exercise current local-first contracts for:
- active timer snapshot persistence and recovery
- active playlist-run snapshot persistence and recovery
- session-log creation from playlist progress
- route continuity through shell navigation and page-level actions

## 8. Risks
- Time-sensitive tests can become flaky if tied to live clock behavior.
- Integration tests may become brittle if they over-assert layout details instead of user-visible outcomes.
- Persisted recovery tests need careful setup so they validate real contracts rather than bypassing them.

## 9. Milestones
1. Audit existing coverage and identify the highest-risk uncovered flows.
2. Add deterministic recovery/integration tests for active timer and playlist-run continuity.
3. Add focused playlist-flow assertions for run blocking and ended-early logging outcomes.
4. Run required verification and fix any regressions.
5. Update decisions and session handoff with outcomes and the next bounded prompt.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Prefer route-level integration tests for persisted recovery because that behavior spans storage, provider hydration, and navigation.
- Use fixed system time in new time-sensitive tests to improve determinism without changing production code.
- Keep this pass focused on missing load-bearing flows instead of chasing broad coverage growth.

## 12. Progress log
- Completed: required docs and milestone prompt review.
- Completed: QA gap audit across existing tests and production-readiness risk areas.
- Completed: added deterministic route-level tests for active timer recovery, playlist start blocking, active playlist continuation, and ended-early playlist logging/history continuity.
- Completed: required verification run (`typecheck`, `lint`, `test`, `build`) with all checks passing.
