# ExecPlan: Production Readiness Testing Hardening

## 1. Objective
Strengthen test coverage and reliability for critical meditation-app flows, with emphasis on fragile route/runtime behavior, persistence boundaries, and cross-screen recovery.

## 2. Why
Milestone D shifts focus from adding new prototype slices to making the existing app trustworthy. The most valuable hardening work now is protecting the flows that can silently regress:
- active timer and playlist recovery
- playlist run continuation and early termination
- summaries and sankalpa behavior on the goals screen
- storage normalization for persisted goal data

## 3. Scope
Included:
- focused ExecPlan-driven QA pass
- route/UI coverage for `Sankalpa` and playlist run behavior
- app-shell recovery coverage for persisted active timer and playlist state
- storage hardening for persisted `sankalpa` entries
- focused reliability-minded test additions only

Excluded:
- new product features
- broad refactors
- visual redesign
- backend service implementation
- unrelated cleanup outside touched test/hardening areas

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-d-production-readiness/01-testing-hardening.md`

## 5. Affected files and modules
- `src/utils/storage.ts`
- `src/utils/storage.test.ts`
- `src/App.test.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `src/pages/PlaylistRunPage.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Recovered active timer and playlist state should surface clear shell-level recovery messaging and resume affordances.
- Sankalpa should remain usable with both empty and populated data states.
- Creating a sankalpa should show explicit validation and success behavior.
- Ending a playlist run early should remain confirmable and produce a clear completion/outcome state.

## 7. Data and state model
- Persisted `sankalpa` entries remain local-first in `localStorage`.
- Stored sankalpa data should be normalized at load time:
  - require valid `id`
  - require supported `goalType`
  - require finite positive `targetValue`
  - require finite positive `days`
  - require valid optional `meditationType`
  - require valid optional `timeOfDayBucket`
  - require parseable `createdAt`
- Invalid stored goal entries should be dropped while preserving valid entries.

## 8. Risks
- Time-sensitive route tests can be flaky if they depend on real clock drift.
- Storage normalization changes can silently alter existing local data behavior if validation is too strict.
- Route-level tests can become brittle if they over-couple to exact copy or DOM structure.

## 9. Milestones
1. Define the QA hardening slice and target the highest-risk gaps.
2. Harden `sankalpa` storage loading behavior at the persistence boundary.
3. Add route/runtime tests for:
   - shell recovery from persisted active timer
   - shell recovery from persisted active playlist run
   - sankalpa page summary + create flow
   - playlist run early-end flow
4. Run verification and update handoff docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual sanity via test assertions on recovery, goal creation, and playlist run outcome flows

## 11. Decision log
- Focus this pass on high-signal regression protection rather than chasing coverage totals.
- Allow one small runtime hardening change where tests expose a weak persistence boundary.

## 12. Progress log
- 2026-03-24: Reviewed required docs and milestone prompt.
- 2026-03-24: Identified remaining high-risk gaps in sankalpa storage validation, route-level recovery, and playlist run outcome coverage.
- 2026-03-24: Began implementation.
- 2026-03-24: Added sankalpa storage normalization and focused route/runtime tests.
- 2026-03-24: Verified with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
