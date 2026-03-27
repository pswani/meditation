# ExecPlan: Milestone D Offline Sync Testing

## Objective
Add strong end-to-end offline/sync verification for Milestone D, focused on startup, offline behavior, reconnection, sync success, and partial-failure retry flows.

## Why
The milestone now has the offline-first architecture, queueing, reconciliation, and remediation in place. Prompt 06 should prove those behaviors hold together across realistic user journeys instead of relying only on isolated helper tests.

## Scope
Included:
- app-level verification of online startup coverage already present in the suite
- offline startup from cached local state with pending queue replay after reconnection
- offline actions across implemented backend-backed domains through existing UI flows
- partial sync failure with a later retry that succeeds without replaying already synced work
- required docs, handoff, and verification updates

Excluded:
- new feature behavior outside offline/sync verification
- new conflict-management UI
- browser automation or dev-server runtime checks unless the existing test harness proves insufficient

## Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-offline-sync-fullstack/06-test-offline-sync-fullstack.md`

## Affected files and modules
- `src/App.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `README.md`
- `docs/architecture.md`

## UX behavior
- Offline startup should keep already saved data visible with calm shell guidance.
- Pending changes should remain on the device while offline and flush when the backend becomes reachable.
- Partial sync failure should keep unsynced work visible, report that another sync attempt is needed, and retry on the next online transition.
- Successful queued work should not be re-sent after it has already synced.

## Data and state model
- Use existing browser storage keys for timer settings, `session log`, `custom play`, playlist, and sync queue state.
- Reuse the stateful app-level fetch mock to model backend hydration and successful replay.
- Add a focused flaky replay test harness around the existing mock for partial-failure retry behavior.

## Risks
- App-level tests can become brittle if they cover too many routes in one scenario.
- Offline startup and retry flows depend on queue state transitions, so the assertions should focus on visible user state plus queue/store outcomes rather than implementation details alone.
- Reconnection retry depends on browser `online` and `offline` events, so tests need explicit event sequencing.

## Milestones
1. Review existing Milestone D test coverage and identify the remaining end-to-end gaps.
2. Add one offline-startup plus reconnect-success journey.
3. Add one partial-failure plus retry-success journey.
4. Run the full required verification suite.
5. Update docs and handoff for prompt 06.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Decision log
- Prefer app-level stateful tests in `src/App.test.tsx` because the main Milestone D risk is cross-feature startup/replay continuity, not isolated helper correctness.
- Keep the new prompt 06 additions to two focused journeys so the suite grows in confidence without becoming noisy or overlapping earlier prompt coverage.

## Progress log
- 2026-03-27: reviewed prompt 06 requirements, current docs, and the existing app-level offline-sync coverage.
- 2026-03-27: identified the remaining gaps as offline startup from cached queued state and partial-failure retry behavior across reconnects.
