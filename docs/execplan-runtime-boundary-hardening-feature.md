# ExecPlan: Runtime Boundary Hardening

## 1. Objective
Reduce the size and responsibility concentration of the frontend runtime boundary by splitting `TimerContext` and `storage.ts` into smaller, testable modules, while also adding route-level code splitting for the primary routes.

## 2. Why
- `src/features/timer/TimerContext.tsx` currently centralizes bootstrap, hydration, queue reconciliation, persistence effects, timer runtime effects, playlist runtime effects, and nearly every context action.
- `src/utils/storage.ts` currently combines storage keys, validators, migrations, normalization, runtime-state persistence, and durable snapshot storage in one large file.
- These dense boundaries slow reviews, raise regression risk, and make production-oriented cleanup harder than it needs to be.

## 3. Scope
Included:
- split `TimerContext` along real responsibility boundaries
- split `storage.ts` into smaller modules while preserving import compatibility through `src/utils/storage.ts`
- reduce avoidable synchronous persistence writes where possible without behavior change
- add route-level lazy loading for the primary routes
- update focused tests and durable docs

Excluded:
- backend query or API contract redesign
- reference-data consolidation
- media asset ownership cleanup
- service-worker cache version redesign
- broad screen-by-screen decomposition outside what the runtime split directly requires

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/production-grade-hardening-phased-plan.md`
- `prompts/runtime-boundary-hardening-feature-bundle-with-branching/01-implement-runtime-boundary-hardening.md`

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- new timer helper or hook modules under `src/features/timer/`
- `src/utils/storage.ts`
- new storage helper modules under `src/utils/`
- `src/App.tsx`
- route-facing tests such as `src/App.test.tsx`
- runtime and persistence tests such as `src/features/timer/TimerContext.test.tsx` and `src/utils/storage.test.ts`
- durable docs:
  - `README.md`
  - `docs/architecture.md`
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`

## 6. UX behavior
- No intended user-facing behavior change for timer, playlist, `custom play`, manual log, recovery, or offline queue behavior.
- Primary route navigation should still feel immediate and reliable after lazy loading.
- Browser refresh and deep links must still work for the primary routes.
- The app must remain calm and responsive across phone, tablet, and desktop.

## 7. Data and state model
- Preserve all existing storage keys and hydration compatibility paths.
- Keep `TimerContext` as the public provider boundary for now, but move internal responsibilities into smaller helpers or hooks.
- Keep the existing queue-backed local-first write model unchanged.
- Keep route components consuming the same context API.

## 8. Risks
- Refactoring effects can introduce stale closures or reorder hydration behavior.
- Splitting persistence code can accidentally change storage-key compatibility or legacy normalization paths.
- Lazy loading can introduce route fallback glitches or test timing issues.
- Pulling too much logic out at once could move complexity around instead of reducing it.

## 9. Milestones
1. Extract storage responsibilities into smaller modules while keeping `src/utils/storage.ts` as the stable import surface.
2. Extract pure bootstrap, persistence, and sync helper logic out of `TimerContext`.
3. Extract runtime-side effects and context action assembly enough to materially shrink `TimerContext`.
4. Add primary-route lazy loading and adjust tests.
5. Update docs and verification artifacts.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- focused checks for:
  - timer persistence write frequency
  - playlist runtime recovery
  - foreground catch-up completion behavior
  - route rendering after lazy loading

## 11. Decision log
- Keep `src/utils/storage.ts` as a compatibility facade so the refactor does not require a repo-wide import rewrite.
- Prefer extracting hooks and helper modules from `TimerContext` over replacing the provider contract.
- Treat route lazy loading as part of this phase because it is one of the requested high-priority items and naturally belongs near runtime-boundary cleanup.

## 12. Progress log
- 2026-04-05: Reviewed the runtime-boundary prompt bundle and repo guidance.
- 2026-04-05: Mapped the main `TimerContext` sections:
  - bootstrap and recovery helpers
  - persistence effects
  - collection hydration effects
  - queue flush effect
  - timer runtime sound and completion effects
  - playlist runtime effect
  - action assembly inside the context value
- 2026-04-05: Mapped the current `storage.ts` responsibilities and chose a compatibility-facade split.
