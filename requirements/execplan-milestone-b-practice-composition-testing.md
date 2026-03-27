# ExecPlan: Milestone B Practice Composition Test Pass

## 1. Objective
Raise confidence in Milestone B by testing the backend-backed manual logging, custom play, media catalog, and playlist flows as coherent app journeys, especially across a fresh app mount.

## 2. Why
Milestone B now spans multiple REST-backed practice-composition features. Existing coverage is strong in isolated modules, but the highest-value remaining risk is integration drift between:
- frontend hydration
- backend-owned persistence
- history continuity after a fresh mount

## 3. Scope
Included:
- review current Milestone B coverage
- add focused app-level tests where backend-backed journeys still lack confidence
- re-run the required frontend and backend verification commands
- update decisions and session handoff for prompt 06

Excluded:
- new product behavior outside testing needs
- e2e framework changes
- unrelated refactors
- Milestone B merge work (handled in prompt 99)

## 4. Source documents
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
- `prompts/milestone-b-practice-composition-fullstack/06-test-practice-composition-fullstack.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-b-practice-composition-testing.md`
- `src/App.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. Test focus
- Manual logging:
  - backend-backed manual-log creation
  - History rehydration on a fresh app mount
- Custom plays and media catalog:
  - media-backed custom-play creation
  - backend persistence across a fresh app mount
- Playlists:
  - backend-hydrated playlist definitions
  - playlist-run auto-log history rehydration on a fresh app mount

## 7. Risks
- Stateful test helpers can become too broad and hard to reason about.
- Fresh-mount integration tests can become flaky if hydration timing is not kept explicit.
- Over-testing the same flows at multiple layers would add noise without increasing confidence.

## 8. Milestones
1. Record the test-plan intent.
2. Extend the app-level test backend mock only as far as needed for Milestone B flows.
3. Add focused backend-backed rehydration tests.
4. Run full required verification.
5. Update docs and commit prompt 06.

## 9. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 10. Decision log
- Prefer app-level integration coverage over more narrow component tests for prompt 06 because the milestone risk is cross-feature hydration and persistence continuity.
- Reuse the existing stateful fetch mock pattern in `src/App.test.tsx` instead of introducing a new testing harness.

## 11. Progress log
- 2026-03-26: reviewed existing Milestone B test coverage and identified fresh-mount backend rehydration as the highest-value remaining gap.
- 2026-03-26: extended the app-level stateful backend mock to cover manual-log creation plus custom-play and playlist list/upsert flows for testing.
- 2026-03-26: added backend-backed fresh-mount coverage for manual logs, custom plays, and playlist-run history continuity in `src/App.test.tsx`.
- 2026-03-26: passed `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 test`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.
