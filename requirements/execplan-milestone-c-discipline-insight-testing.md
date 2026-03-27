# ExecPlan: Milestone C Discipline Insight Testing

## 1. Objective
Run a strong Milestone C testing pass that proves `summary`, `sankalpa`, and their shared `session log` dependencies hold together across frontend and backend behavior.

## 2. Why
Milestone C now has backend-backed `summary` and `sankalpa` flows plus a remediation pass for data trust and time-zone consistency. The remaining work is confidence: we need load-bearing tests that cover the interaction surface, not just isolated endpoints or isolated UI fragments.

## 3. Scope
Included:
- add focused tests for `summary`
- add focused tests for `sankalpa`
- add at least one interaction test spanning `history`/manual logs into `summary` and `sankalpa`
- add backend contract coverage for invalid `timeZone` input on the remediated routes
- run full verification
- update decisions, session handoff, and milestone docs

Excluded:
- feature changes outside what the tests require
- new UX work
- new REST routes or schema changes

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
- `prompts/milestone-c-discipline-insight-fullstack/05-test-discipline-insight-fullstack.md`

## 5. Affected files and modules
- `src/App.test.tsx`
- `backend/src/test/java/com/meditation/backend/summary/SummaryControllerTest.java`
- `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-milestone-c-discipline-insight-testing.md`

## 6. Test focus
- prove backend-backed manual-log history updates can surface correctly in `summary` and `sankalpa`
- prove remediated `timeZone` input fails cleanly when invalid
- keep tests focused on trust-bearing flows rather than shallow rendering

## 7. Risks
- app-level test mocks can drift from the real REST contracts if they over-simplify backend responses
- interaction tests can become brittle if they rely on incidental UI text instead of stable user-facing outcomes
- adding more than a small number of tests would widen the slice unnecessarily

## 8. Milestones
1. Define the confidence gaps worth covering.
2. Add app-level interaction coverage for `history` -> `summary`/`sankalpa`.
3. Add backend contract tests for invalid `timeZone`.
4. Run full verification, update docs, and commit.

## 9. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 10. Decision log
- Prefer one stateful app-level interaction test over several narrower UI tests so the load-bearing cross-screen behavior is covered without bloating the suite.
- Add negative-path backend contract coverage for invalid `timeZone` input because prompt 04 introduced that boundary as part of trustworthiness remediation.

## 11. Progress log
- Completed: prompt scope review and confidence-gap selection.
- Completed: added app-level interaction coverage for `history` manual logs flowing into backend-backed `summary` and `sankalpa` surfaces.
- Completed: added backend contract coverage for invalid `timeZone` input on `summary` and `sankalpa` routes.
- Completed: verification passed with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `mvn -Dmaven.repo.local=../local-data/m2 test`, and `mvn -Dmaven.repo.local=../local-data/m2 verify`.
