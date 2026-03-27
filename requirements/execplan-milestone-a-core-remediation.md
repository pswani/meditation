# ExecPlan: Milestone A Core Full-Stack Remediation

## 1. Objective
Fix the important Milestone A review findings around timer-settings trust:

- prevent backend timer-settings hydration from overwriting in-progress edits on Practice and Settings
- make Settings save feedback reflect actual backend persistence outcome

## 2. Why
The current core full-stack flow works, but two behaviors still undermine user confidence:

- users can interact with timer/default controls before backend hydration settles
- Settings can claim success before H2-backed persistence has actually completed

Both issues affect trust in the saved-defaults experience, which is core to the calm launch flow on Home and Practice.

## 3. Scope
Included:

- timer-settings interaction behavior on `Practice`
- timer-settings interaction behavior and save feedback on `Settings`
- timer-context sync state needed to support truthful save UX
- focused tests covering the remediated behavior
- docs and handoff updates for prompt 04

Excluded:

- broader separation of Practice session draft vs saved defaults
- playlist/session-log REST expansion
- large `TimerContext` decomposition
- sound playback work

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-core-fullstack.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/pages/PracticePage.tsx`
- `src/pages/SettingsPage.tsx`
- related tests:
  - `src/App.test.tsx`
  - `src/pages/PracticePage.test.tsx`
  - `src/pages/SettingsPage.test.tsx`
- milestone docs:
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`

## 6. UX behavior
- Practice timer controls should not be editable until backend timer settings finish hydrating.
- Settings defaults controls should not be editable until hydration finishes.
- Settings should show truthful save state:
  - saving while the backend write is in flight
  - success only after the backend write succeeds
  - warning on backend failure without a contradictory success banner

## 7. Data and state model
- Keep the current shared `settings` source of truth for this prompt.
- Add explicit settings-sync state in timer context for UI feedback.
- Preserve existing backend hydration, local cache fallback, and H2 persistence assumptions.

## 8. Risks
- Adding sync-state feedback could accidentally regress current optimistic UI behavior or tests.
- Disabling controls too broadly could block unrelated Practice actions.
- Need to avoid introducing a larger defaults-vs-draft refactor in this bounded remediation slice.

## 9. Milestones
1. Add timer-settings sync state needed by Settings save UX.
2. Prevent pre-hydration timer/default editing on Practice and Settings.
3. Update focused tests for loading lock and truthful save feedback.
4. Run verification and update docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- targeted manual sanity on:
  - Home -> Practice while settings hydrate
  - Settings save success/failure flow

## 11. Decision log
- Keep the remediation bounded to interaction-locking and truthful save feedback.
- Do not separate Practice draft state from saved defaults in this prompt; keep that as a later improvement if still needed after remediation.

## 12. Progress log
- 2026-03-26: Plan created from prompt 04 review findings.
