# ExecPlan: Milestone D Offline Frontend and Sync Queue

## 1. Objective
Wire the shared offline-first sync foundations into the implemented frontend domains so the app stays usable offline, stores deferred writes locally, and retries queued sync work when connectivity returns.

## 2. Why
The architecture foundation now exists, but the user journey is still incomplete unless real domain actions can succeed while offline. This prompt turns the queue into practical behavior for meditation setup, logging, custom plays, playlists, sankalpas, and summary fallback.

## 3. Scope
Included:
- offline-aware hydration for backend-backed frontend domains
- queue-backed offline saves for:
  - timer settings
  - session logs, including manual logs
  - custom plays
  - playlists
  - sankalpas
- retry and flush behavior when the browser comes back online
- calm sync/offline messaging on affected screens
- focused tests and milestone docs updates

Excluded:
- backend endpoint changes or reconciliation schema changes
- new route structure or heavy sync-management UI
- unrelated `TimerContext` refactors beyond what queue wiring requires

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
- `requirements/execplan-milestone-d-offline-architecture.md`
- `prompts/milestone-d-offline-sync-fullstack/02-offline-frontend-and-sync-queue.md`

## 5. Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/features/timer/TimerContext.test.tsx`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/HomePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `src/pages/HomePage.test.tsx`
- `src/pages/HistoryPage.test.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `src/App.test.tsx`
- `src/utils/manualLog.ts`
- `src/utils/syncQueue.ts`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Offline startup should fall back to existing local data quickly and say so plainly.
- Offline saves should succeed locally for supported domains and explain that sync will happen later.
- Reconnection should quietly flush queued work and clear degraded status when successful.
- Summary and sankalpa views should keep local-derived or local-cached content visible while offline.
- Messaging must stay calm, lightweight, and local to the relevant surfaces.

## 7. Data and state model
- Queue deferred write payload snapshots in browser storage and replay them in queued order.
- Use the existing REST utility modules for queue flush attempts; do not create duplicate transport layers.
- Track queue state through the shared sync provider so shell messaging and feature messaging stay aligned.
- Manual log offline saves should generate a local `session log` entry up front, then sync that entry through the existing `session log` upsert route when back online.

## 8. Risks
- Queue flush logic can become tangled if feature-specific error handling stays embedded in multiple code paths.
- Offline saves must not fork local state in a way that makes later backend hydration overwrite recent user changes unexpectedly.
- Reconnection retries should avoid noisy banners or double-saving the same payload repeatedly.

## 9. Milestones
1. Add queue helper coverage needed for frontend replay flows.
2. Wire `TimerContext` hydration, save, and flush logic to support offline queueing for timer settings, session logs, custom plays, and playlists.
3. Wire `useSankalpaProgress` and summary loading for calmer offline behavior.
4. Add focused tests for offline save, retry, and reconnection flows.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Reuse the existing REST utility modules for queue flush attempts so online and offline paths converge on the same transport contracts.
- Treat offline manual logs as local `session log` entries immediately, because the generic `session log` upsert route can reconcile them later without blocking the user on the dedicated manual-log create endpoint.
- Prefer immediate local state updates plus queued sync over disabled forms, because the product’s local-first intent values uninterrupted practice and logging.

## 12. Progress log
- Completed: prompt review and scope definition.
- In progress: map live write paths onto queue-backed local-first behavior.
