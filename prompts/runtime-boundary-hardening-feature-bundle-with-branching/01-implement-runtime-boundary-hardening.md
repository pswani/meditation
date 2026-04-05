Read before implementation:
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

Implementation objective:
- Make the frontend runtime boundaries smaller, clearer, and more production-friendly without changing the product surface or offline-first behavior.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-runtime-boundary-hardening-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
   - scope and exclusions
   - affected modules
   - UX behavior and validations
   - data and state model
   - risks and tradeoffs
   - milestones
   - verification plan
   - decision log
   - progress log

Required behavior:
1. Break up `src/features/timer/TimerContext.tsx` into smaller modules, hooks, helpers, or providers so the orchestration surface becomes materially easier to reason about and test.
2. Break up `src/utils/storage.ts` into smaller persistence boundaries while preserving existing storage keys, migrations, normalization, and recovery behavior unless a deliberate migration is documented.
3. Audit browser-persistence write frequency and reduce avoidable synchronous writes where that can be done safely.
4. Preserve current behavior for:
   - timer setup and active sessions
   - `custom play` runtime
   - playlist runtime
   - manual logs
   - recovery and hydration
   - offline queue behavior
   - timer sound behavior
5. Add route-level code splitting for the primary routes and preserve deep-link, refresh, and BrowserRouter behavior.
6. If `AppShell` or route-facing helpers need decomposition to support the runtime split or lazy route loading, keep that work tightly bounded and behavior-preserving.
7. Keep responsive multi-device UX intact and do not widen into a design refresh.
8. Do not pull in later-phase backend, config, or asset-cleanup work.

Suggested implementation direction:
- Prefer extracting focused runtime modules over moving logic into one new mega-file.
- Keep business logic out of large JSX trees and keep stable public boundaries for route components where practical.
- Consider a structure that separates:
  - timer session runtime
  - `custom play` runtime
  - playlist runtime
  - queue-backed collection sync
  - persistence hydration and save boundaries
  - timer sound playback coordination
- Prefer route lazy loading through the current React Router setup without inventing a second routing model.

Expected affected areas:
- `src/features/timer/`
- `src/features/sync/`
- `src/utils/storage.ts`
- any new `src/utils/storage*` modules introduced by the split
- `src/App.tsx`
- `src/app/AppShell.tsx`
- route-level pages only where required by the decomposition or lazy-loading boundary

Required tests:
- Add or update focused tests for extracted runtime helpers, hooks, reducers, or persistence modules.
- Preserve or improve tests covering hydration and recovery behavior.
- Add or update a focused test that protects route-level code splitting or lazy-route behavior if practical.
- Preserve or improve coverage for timer, `custom play`, playlist, and manual-log flows touched by the split.

Documentation updates:
- Update `README.md` if any durable architectural descriptions or runtime notes change.
- Update `docs/architecture.md` for the new runtime boundary structure.
- Update `requirements/decisions.md` for any long-lived decomposition or persistence-boundary decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification only if this phase changes backend code or contracts

Suggested durable artifacts:
- `docs/execplan-runtime-boundary-hardening-feature.md`
- `docs/review-runtime-boundary-hardening-feature.md`
- `docs/test-runtime-boundary-hardening-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `refactor(runtime): split timer and storage boundaries`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results

