# ExecPlan: Offline App Sync Feature

## 1. Objective
Make the meditation app reopen after a prior successful visit when the browser is offline, keep the primary meditation flows usable from local data when backend services are unreachable, and resume queue-backed sync automatically once the backend becomes reachable again.

## 2. Why
The repo already supports local-first writes for several backend-backed domains, but the overall experience is still incomplete:
- the SPA itself does not have an offline app shell
- backend outages are not clearly separated from browser-offline state
- some read-heavy flows fall back only for the current request rather than from a durable last-successful snapshot

This slice closes those gaps so offline and degraded connectivity feel like one trustworthy capability instead of a collection of partial fallbacks.

## 3. Scope
Included:
- add a minimal offline app shell strategy for the SPA
- register a service worker and manifest-backed install metadata
- distinguish browser offline from backend unreachable in app-level sync state
- gate queue replay on backend reachability, not only `navigator.onLine`
- preserve useful local or last-successful state for Home, Practice, History, Goals, and Settings
- add durable last-successful fallback caching for summary and managed media catalog reads
- surface calm, explicit offline or degraded-state messaging

Excluded:
- a new `/sync/*` backend surface
- major navigation or visual redesign
- browser upload/import for media
- caching the full backend media library without a bounded policy
- replacing the current REST and H2 architecture

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
- `prompts/offline-app-sync-feature-bundle-with-branching/01-implement-offline-app-sync.md`

## 5. Affected files and modules
- `src/main.tsx`
- `src/App.tsx`
- `src/app/AppShell.tsx`
- `src/features/sync/SyncStatusProvider.tsx`
- `src/features/sync/syncContextObject.ts`
- `src/features/sync/useSyncStatus.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/utils/apiClient.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/summaryApi.ts`
- `src/utils/storage.ts`
- new offline-app helper files and public service-worker assets
- focused tests for sync, fallback, and offline shell behavior

## 6. UX behavior
- The shell should explain whether the user is:
  - offline
  - online but waiting for the backend
  - online with pending sync
  - online with failed sync retry work
- Existing route-level messaging should stay calm and compact.
- The app should keep primary routes usable from cached local state or last-successful derived data.
- Summary fallback should prefer a last-successful snapshot when possible, with locally derived fallback still available.
- Managed media catalog fallback should prefer a last-successful backend catalog before the built-in sample list.
- Audio-backed runtime flows must explain when playback is unavailable because the file is not cached locally.

## 7. Data and state model
- Extend sync state with:
  - `isOnline`
  - backend reachability state
  - derived connection mode for UI
  - queue summary as today
- Let sync consumers report backend success or failure so real API traffic can update reachability immediately.
- Probe `/api/health` on a throttled basis while browser connectivity exists to recover from backend outages.
- Persist new last-successful read snapshots in browser storage:
  - summary snapshots by date-range request key and time zone
  - managed media catalog snapshot
- Add a service worker that:
  - serves a cached app shell for navigation fallback
  - caches same-origin static assets seen by the client
  - supports versioned cache names for safe replacement

## 8. Risks
- Service-worker caching can accidentally serve stale assets if cache versioning or activation is wrong.
- Reachability probes can become noisy or block sync too aggressively if the state machine is too eager.
- Queue replay must not regress current stale-write protection or idempotent `session log` behavior.
- Media playback behavior can be misleading if the UI promises offline playback for files that were never cached.
- Tests need to stay deterministic despite service-worker and connectivity state transitions.

## 9. Milestones
1. Add the offline app-shell foundation:
   - manifest
   - service worker
   - registration helper
2. Extend sync status to model backend reachability and expose reporting hooks.
3. Rewire timer and sankalpa sync flows to use backend reachability for hydration and queue flush gating.
4. Add durable last-successful fallback caching for summary and managed media catalog reads.
5. Refine shell and route messaging for offline and degraded states.
6. Add focused tests and durable docs updates.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- focused unit/component checks for:
  - service-worker registration helper
  - sync reachability transitions
  - queue replay gating
  - summary fallback cache behavior
  - media catalog fallback cache behavior

## 11. Decision log
- Use a minimal in-repo service worker instead of adding a heavyweight offline plugin unless implementation friction proves too high.
- Keep the current REST routes as the sync boundary.
- Treat backend-unreachable as distinct from browser-offline so the app can message recovery truthfully.

## 12. Progress log
- 2026-04-04: Reviewed bundle requirements and current offline foundations.
- 2026-04-04: Confirmed the main gaps are offline app-shell boot, backend reachability modeling, and durable read fallback caching.
