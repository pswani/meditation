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

Implementation objective:
- Make the application available offline after a successful visit, keep core meditation workflows usable when backend services are unreachable, and sync queued local changes when the backend becomes reachable again.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-offline-app-sync-feature.md` before making substantial code changes.
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

Problem context:
- The repo already has local-first writes, browser-persisted queue state, and local cache fallback for several backend-backed domains.
- The app still treats browser online status as the primary sync signal, so backend outages can behave differently from true offline mode.
- The repo does not yet include a true offline app shell, service worker, or manifest-backed strategy to reopen the SPA without network after a prior successful load.
- Some read flows already have cache or derived fallback behavior, but this slice should make offline/degraded behavior feel like one coherent product capability rather than a set of disconnected fallback paths.

Required behavior:
1. After at least one successful online visit, the frontend shell should be able to open again when the browser is offline or when the backend becomes unreachable.
2. The app should distinguish:
   - browser offline
   - browser online but backend unreachable
   - backend reachable with pending or failed sync work
3. Shell messaging must stay calm, compact, and trustworthy across those states.
4. The sync queue must avoid aggressive replay while the backend is still unreachable and should resume replay automatically when the backend becomes reachable again.
5. Core primary routes must remain useful from local state or last-successful cached state:
   - Home
   - Practice
   - History
   - Goals
   - Settings
6. Summary and media-catalog behavior should preserve a durable last-successful or local-derived fallback instead of depending only on the current request cycle.
7. Audio-backed `custom play` and playlist items must have explicit offline behavior:
   - playable when required media is already cached locally
   - otherwise blocked or warned with calm, explicit copy
8. Existing stale-write protection, idempotent `session log` replay, and current REST boundaries must remain intact.
9. Do not introduce a new sync transport or widen the slice into broader product redesign.

Suggested implementation direction:
- Prefer a minimal-dependency app-shell strategy that fits the current Vite setup, such as a small in-repo service worker plus registration helper, over introducing a heavyweight plugin by default.
- Extend `src/features/sync/` so sync state models backend reachability, not just `navigator.onLine`.
- Use the existing `/api/health` boundary or an equally small existing route as the reachability probe unless the ExecPlan justifies a safer variant.
- Keep queue replay on the existing entity-specific REST routes.
- Add explicit storage for any new durable offline snapshots rather than hiding them in route components.
- Keep route components consuming stable domain state and calm sync status rather than owning fetch/replay policy directly.
- Be deliberate about cache invalidation and versioning so a new deploy can replace stale app-shell assets safely.

Expected affected areas:
- `src/main.tsx`
- `src/app/AppShell.tsx`
- `src/features/sync/`
- `src/features/timer/TimerContext.tsx`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/utils/apiClient.ts`
- `src/utils/storage.ts`
- `src/utils/summaryApi.ts`
- `src/utils/mediaAssetApi.ts`
- `src/pages/`
- `vite.config.ts`
- any new service-worker or manifest files needed for the offline app shell

Required tests:
- Add or update focused tests for backend-reachability state transitions and queue replay gating.
- Add or update focused tests for offline boot or offline-shell registration behavior.
- Add or update tests covering calm fallback rendering for the affected routes or underlying hooks.
- Add or update tests for any explicit offline media-availability guard behavior.
- Preserve or improve coverage for existing queue replay guarantees, especially stale-write protection and idempotent `session log` replay.

Documentation updates:
- Update `README.md` for the new offline-app behavior and any operational notes that change.
- Update `docs/architecture.md` for the app-shell/offline model and reachability-state design.
- Update `docs/ux-spec.md` or `docs/screen-inventory.md` if user-facing offline behavior changes need durable wording.
- Update `requirements/decisions.md` for any long-lived offline/sync decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification if this slice changes backend code or backend contract behavior

Suggested durable artifacts:
- `docs/execplan-offline-app-sync-feature.md`
- `docs/review-offline-app-sync-feature.md`
- `docs/test-offline-app-sync-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(sync): add offline app shell and backend reachability recovery`

Deliverables before moving on:
- coherent ExecPlan
- code changes
- updated tests
- updated durable docs
- verification results
