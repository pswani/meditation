# ExecPlan: Milestone B Practice Composition Testing and QA

## 1. Objective
Strengthen Milestone B automated test coverage for validation, differentiation, persistence, playlist rules, and REST-style integration boundaries without expanding product scope.

## 2. Why
Milestone B behavior is now integrated across manual logging, custom plays, playlists, and history. QA hardening reduces regression risk in high-trust paths (`session log` correctness, ordering/run logic, and persistence boundaries).

## 3. Scope
Included:
- manual log validation edge cases
- manual vs auto differentiation assertions
- custom play validation and persistence-oriented helper checks
- media asset selection contract/behavior checks
- playlist ordering and total-duration helper edge cases
- playlist run and logging rule edge cases
- REST boundary tests for milestone-relevant API wrappers
- fragile test reliability cleanup where needed

Excluded:
- product behavior changes outside tests
- new feature implementation
- milestone C and beyond scope

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
- `prompts/milestone-b-practice-composition/10-test-practice-composition.md`

## 5. Affected files and modules
Expected edits:
- `src/utils/manualLog.test.ts`
- `src/pages/HistoryPage.test.tsx`
- `src/utils/customPlay.test.ts`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `src/utils/mediaAssetApi.test.ts`
- `src/utils/playlist.test.ts`
- `src/utils/playlistRunPolicy.test.ts`
- `src/utils/playlistLog.test.ts`
- `src/utils/playlistApi.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
No user-facing behavior changes planned. This slice validates that existing Milestone B UX and domain rules remain stable under edge and boundary conditions.

## 7. Data and state model
No model schema changes planned. Tests will verify:
- input validation constraints
- log differentiation and status/source integrity
- persistence/normalization behavior through API boundaries
- ordering and duration derivation invariants

## 8. Risks
- Test brittleness due to shared localStorage or ambiguous selectors.
- Overlapping assertions that duplicate existing tests without increasing confidence.
- Narrow edge-case assumptions causing false negatives.

## 9. Milestones
1. Add manual log and manual-vs-auto differentiation coverage.
2. Harden custom play/media selection + persistence-oriented tests.
3. Extend playlist helper/run/logging boundary tests.
4. Strengthen REST boundary tests.
5. Run required verification commands.
6. Update decisions/session-handoff and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Keep QA hardening bounded to test files and documentation; no product behavior changes in this slice.
- Prefer adding edge-case assertions in existing milestone-relevant suites over creating broad new integration harnesses.
- Improve test reliability where cheap and useful by enforcing explicit `localStorage` cleanup in touched UI tests.

## 12. Progress log
- Completed: QA scope review and test-gap mapping.
- Completed: milestone 1 (manual log validation and manual-vs-auto differentiation coverage).
- Completed: milestone 2 (custom play/media behavior and persistence-oriented helper assertions).
- Completed: milestone 3 (playlist helper/run/logging edge-case coverage).
- Completed: milestone 4 (REST boundary normalization coverage for playlists and media contract assertions).
- Completed: milestone 5 (`typecheck`, `lint`, `test`, and `build` all passing).
- Completed: milestone 6 (decision and handoff docs updated; ready to commit).
