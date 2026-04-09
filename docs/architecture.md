# Architecture

## Front-end architecture
Single-page React application with route-based screens and feature-oriented modules.

## Current runtime architecture
- React SPA built by Vite for static deployment
- Spring Boot backend foundation under `backend/`
- default backend runtime with developer-only surfaces disabled
- `dev` backend profile for local-only conveniences such as the H2 console
- shared frontend API client and API-base helpers under `src/utils`
- manifest-backed install metadata plus a minimal in-repo service worker for offline app-shell reopening
- route-level screens in `src/pages`
- feature logic in `src/features`
- shared domain types in `src/types`
- shared frontend reference values in `src/types/referenceData.ts`
- storage, validation, summary, and API-boundary helpers in `src/utils`
- backend-backed persistence for custom plays, playlists, sankalpas, timer settings, and session logs
- sankalpa persistence now includes manual observance labels plus per-date observance records for `observance-based` goals
- browser `localStorage` fallback caches and migration support for backend-backed flows, including sankalpas
- browser-persisted last-successful snapshots for summary and managed media catalog reads
- browser-persisted sync queue state for offline-first deferred writes
- Vite dev `/api` proxy for same-origin frontend/backend local development
- backend-served `/media/**` paths backed by the configured filesystem media root
- H2 + Flyway backing the backend foundation

## Recommended production topology
- serve the frontend production build from a static web server such as nginx
- reverse-proxy `/api/**` and `/media/**` from that web server to the Spring Boot backend
- run the backend on a loopback bind such as `127.0.0.1:8080`
- keep H2 files and backend media files on the application host filesystem
- reserve Vite dev and preview servers for local development and verification only

## Confirmed current gaps
- full-stack wiring is now in place for:
  - custom plays
  - custom-play media asset metadata and managed-library selection
  - playlists
  - sankalpas
  - summaries
  - timer settings
  - session logs
- no browser upload/import workflow yet; managed custom-play media registration is still script-driven
- playlist runtime now supports:
  - mixed timed items and linked-recording items backed by saved `custom play` media
  - optional small gaps between playlist items
  - persisted active-run recovery for the current item or gap phase
  - per-item `session log` creation for completion and early-end outcomes

## Chosen full-stack target architecture
- keep the current React front end and route model
- keep one Spring Boot backend application as the primary server
- use H2 as the first persistent datastore
- store media files under a configured filesystem root, outside the database
- store media metadata and relative media paths in database tables
- migrate front-end API boundaries from local shims to real REST calls incrementally

## Planned backend responsibilities
- expose REST endpoints for:
  - health
  - custom plays
  - summaries
  - timer settings
  - session logs
  - manual session-log creation
  - playlists
  - sankalpas
  - custom-play media assets
- serve configured media files through stable public paths
- own H2 persistence and schema evolution
- validate and normalize stored records before returning them to the front end
- manage the configured media root and DB-referenced media metadata

## Planned implementation order
1. backend foundation and H2 configuration
2. schema/migration support and core persistence entities
3. media metadata + filesystem conventions
4. front-end REST integration foundation and media asset transport
5. session-log and timer-settings backend APIs
6. sankalpa backend APIs
7. broader feature-by-feature migration away from local-only persistence

## Current backend module structure
- `backend/src/main/java/com/meditation/backend/config`
- `backend/src/main/java/com/meditation/backend/customplay`
- `backend/src/main/java/com/meditation/backend/health`
- `backend/src/main/java/com/meditation/backend/media`
- `backend/src/main/java/com/meditation/backend/playlist`
- `backend/src/main/java/com/meditation/backend/sankalpa`
- `backend/src/main/java/com/meditation/backend/settings`
- `backend/src/main/java/com/meditation/backend/summary`
- `backend/src/main/java/com/meditation/backend/sessionlog`
- current custom-play REST surfaces include:
  - `/api/custom-plays`
- current playlist REST surfaces include:
  - `/api/playlists`
- current sankalpa REST surfaces include:
  - `/api/sankalpas`
    - accepts optional `timeZone` query input for time-of-day filter evaluation
    - also persists manual observance labels and per-date observance records for `observance-based` goals
- current session-log REST surfaces include:
  - `/api/session-logs`
    - accepts optional `startAt`, `endAt`, `meditationType`, and `source` filters
    - accepts optional `page` plus `size` inputs and returns an envelope with `items`, `page`, `size`, `totalItems`, and `hasNextPage`
  - `/api/session-logs/manual`
- current summary REST surfaces include:
  - `/api/summaries`
    - accepts optional `timeZone` query input for time-of-day aggregation
    - accepts optional `meditationType` and `source` filters
- reserved domain packages for:
  - `reference`
- shared backend reference constants and validation helpers live in `backend/src/main/java/com/meditation/backend/reference/ReferenceData.java`

## Media storage conventions
- backend media root is configurable through `MEDITATION_MEDIA_STORAGE_ROOT`
- current default media root resolves to `local-data/media`
- custom-play media lives under the `custom-plays/` subdirectory
- script-managed timer sounds live under the sibling `sounds/` subdirectory when they are not shipped bundled assets
- H2 stores relative paths such as `custom-plays/vipassana-sit-20.mp3`
- API responses expose a web-facing path such as `/media/custom-plays/vipassana-sit-20.mp3`
- backend resource handling serves `/media/**` from the configured media root
- shipped timer sounds stay in `src/assets/sounds/` and are declared in `src/data/timerSoundCatalog.json` with explicit `bundled` ownership
- script-added timer sounds are declared in that same catalog with explicit `media` ownership and resolve through `/media/sounds/<filename>`

## Principles
- mobile-first
- responsive across device classes
- simple local-first architecture
- offline-first write safety with calm sync visibility
- minimal dependencies
- predictable state
- domain-first naming

## Offline-first foundations
- `src/features/sync/` owns app-level connectivity status and sync queue visibility.
- `src/features/sync/offlineApp.ts` owns service-worker registration and bounded URL pre-caching requests.
- `src/features/sync/offlineCacheVersion.ts` owns the shared app-asset version used to register the offline service worker.
- `src/utils/syncQueue.ts` owns queue persistence and queue-reduction helpers.
- Queue entries are stored in browser storage so deferred writes survive reloads.
- The shell surfaces offline and pending-sync state as lightweight status banners instead of blocking overlays or dashboard-style widgets.
- The shell now distinguishes browser-offline from backend-unreachable states, keeping degraded sync explicit without overstating a full device disconnect.
- The service worker caches the SPA shell and same-origin runtime assets after a successful visit so the app can reopen offline without introducing a second application runtime.
- The service worker cache namespace derives from the computed frontend asset version carried on the registration URL, so deploys invalidate stale caches without hand-editing version strings in two files.

## Current offline write model
- Implemented backend-backed writes are local-first for:
  - timer settings
  - session logs
  - custom plays
  - playlists
  - sankalpas
- UI state updates immediately from local changes, then the queue replays those writes through the existing REST boundaries when the browser is online.
- Queue reduction keeps only the latest relevant mutation per `(entity type, record id)` so repeated offline edits do not accumulate stale replay work.
- Hydration overlays queued local mutations on top of the latest backend list responses so a stale backend read does not temporarily resurrect deleted records or erase unsynced edits.
- Failed queue entries can return to a pending state for later retry, while the shell and feature-level copy stay calm and explicit about degraded sync.
- `Sankalpa` replay now keys off the queued replay payload shape rather than queue state metadata alone, so failed-entry bookkeeping does not repeatedly re-fetch and re-enqueue the same goals.
- Backend reachability recovery is now probe-driven:
  - queue replay and collection hydration may proceed while reachability is `unknown`
  - browser-offline and health-probe failures can mark the backend as unavailable for future retries
  - successful backend reads or writes mark reachability back to `reachable`

## Backend reconciliation model
- The existing REST routes remain the sync boundary; this milestone does not introduce a second `/sync/*` API surface.
- Queue flushes send a queued-mutation timestamp to the backend so mutable records can reject stale offline writes safely.
- Timer settings, custom plays, and playlists now use backend-side stale-write protection:
  - newer backend state wins over an older queued mutation
  - stale queued deletes return the current backend-backed record so the UI can restore it with explicit warning copy instead of treating the delete as silent success
- `Session log` replay uses stable client ids and idempotent `PUT` behavior so retrying the same queued write does not duplicate persisted history rows.
- `Sankalpa` replay stays id-stable across create, edit, and archive writes:
  - edits preserve the original goal id and `createdAt` so deadline windows stay trustworthy
  - archive remains a boolean goal-state mutation on the same record instead of creating a second history entity

## Query and API-boundary strategy
- Summary overall totals, by-type totals, by-source totals, and `sankalpa` goal-window matching now prefer repository aggregates or reduced projections over loading full `session log` entities into service memory.
- Time-zone-aware time-of-day bucketing still happens in service code, but only after fetching reduced `endedAt`, `status`, and duration projections for the filtered window.
- `session log` reads now expose an explicit filtered collection contract and an opt-in paged contract so larger datasets do not require a second ad hoc endpoint later.
- The frontend shared API client now owns a default request timeout plus explicit timeout and cancellation classification so route and sync code do not need to reinvent that behavior per feature.
- Shared product vocabularies now stay centralized per runtime:
  - frontend lists and guards live in `src/types/referenceData.ts`
  - backend lists, validation helpers, and time-of-day bucketing live in `backend/.../reference/ReferenceData.java`
  - Flyway-seeded meditation types are kept aligned with backend reference order through a dedicated Spring test

## Frontend reconciliation boundaries
- `src/features/timer/TimerContext.tsx` remains the public provider boundary for timer, playlist, custom-play, and session-log runtime state.
- `src/features/timer/timerProviderHelpers.ts` now owns provider bootstrap, recovery, persistence-shaping, and last-used-meditation helper logic that used to sit directly inside `TimerContext`.
- `src/features/timer/useTimerSyncEffects.ts` now owns the queue hydration, backend fetch, replay, and optimistic reconciliation side effects that used to sit directly inside `TimerContext`.
- `src/features/sankalpa/useSankalpaProgress.ts` owns local-first sankalpa hydration, queue flushing, and offline fallback guidance.
- `src/features/sankalpa/ObservanceTracker.tsx` owns the calm per-date observance check-in UI for `observance-based` goals.
- Route components continue to consume stable domain state and sync status rather than performing queue mutation logic directly.
- Manual log creation is treated as local `session log` creation first, then reconciled back through the shared `session log` sync flow instead of a separate offline-only pathway.
- Summary and managed media catalog reads keep durable last-successful snapshots in browser storage so the UI can prefer a trusted prior backend result before dropping all the way back to sample or locally derived data.
- Audio-backed recording files are cached only on demand after the user has touched them, preserving a bounded offline-media policy instead of pre-caching the entire managed library.
- Browser storage helpers now live under `src/utils/storage/` by domain (`settings`, `sessionLogs`, `collections`, `snapshots`, `runtime`), while `src/utils/storage.ts` stays in place as the stable import facade.

## Suggested module layout
- pages
- components
- features
- types
- utils

## Routing
Current primary routes:
- /
- /practice
- /practice/active
- /practice/playlists
- /practice/playlists/active
- /history
- /goals
- /sankalpa (redirects to `/goals` for compatibility)
- /settings

Primary route screens are lazy-loaded behind route-level Suspense boundaries so the shared shell stays eager while individual screens split into separate chunks.

## Responsive shell guidance
- mobile: bottom navigation
- tablet and desktop: top or side navigation may be appropriate
- shared route structure should remain consistent across devices
