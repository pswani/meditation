# Meditation App

Calm, minimal meditation practice app built with React, TypeScript, and Vite.

This README is intentionally grounded in the current repository contents. It explains what exists today, what is only planned, and where the operational gaps still are.

## Workspace Entry Points

Use the repo from the entrypoint that matches your task:

- Web app and shared frontend code:
  - `src/`, `public/`, `index.html`, `vite.config.ts`
- Spring Boot backend:
  - `backend/`
- Native iPhone app:
  - `ios-native/MeditationNative.xcodeproj` for app development, simulator builds, device runs, and UI tests
  - `ios-native/Package.swift` for the shared `MeditationNativeCore` package and its focused core tests
- Durable product and operational docs:
  - `docs/README.md`
  - `requirements/`
  - `AGENTS.md`
  - `PLANS.md`
- Repo scripts and operator flows:
  - `scripts/`
- Prompt runner and any explicitly requested bundles:
  - `prompts/`
- Ignored local runtime state created by builds, scripts, or verification:
  - `local-data/`

## Supported Toolchain Baseline

- Node.js 20.x
- npm 10 or newer recommended
- Java 21
- Maven 3.9 or newer
- Xcode with iOS 17 simulator or device support for native app work
- Swift 6.3 toolchain support for `swift test --package-path ios-native`

Machine-readable repo baselines:

- `.nvmrc` pins the expected Node major version for the web and frontend-backed scripts
- `package.json` `engines` captures the supported Node and recommended npm baseline for this workspace
- `.editorconfig` captures the shared line-ending, charset, and indentation defaults across the mixed-language workspace

## Current Status

- This workspace now contains:
  - a React front end
  - a Spring Boot backend foundation in `backend/`
- The backend foundation includes:
  - H2 datasource configuration
  - Flyway migrations
  - local-development CORS
  - a health endpoint
  - a seeded media metadata API
  - backend persistence for custom plays, playlists, sankalpas, timer settings, and session logs
  - backend summary aggregation over persisted `session log` history
- The frontend now includes:
  - a shared typed API client
  - a configurable API base URL strategy
  - a Vite local-dev `/api` proxy for the in-repo backend
  - live backend media loading with graceful sample fallback
- backend-backed timer settings and session-log history with local cache fallback during hydration failures
- backend-backed sankalpa persistence and progress loading with local cache fallback during backend failures
- backend-backed summary views on the `Sankalpa` screen with local derived fallback during summary API failures
- shared offline-first sync foundations:
  - browser-persisted sync queue storage
  - app-level online/offline status tracking
  - calm shell messaging for offline and pending-sync states
  - manifest and service-worker-backed offline app shell reopening after a successful visit
  - bounded runtime caching for same-origin assets and on-demand recording media
- local-first offline write behavior for:
  - timer settings
  - session logs, including manual logs
  - custom plays
  - playlists
  - sankalpas
- sync-safe backend reconciliation for queued offline writes:
  - stale queued updates do not overwrite newer backend-backed timer settings, custom plays, or playlists
  - `session log` retries remain idempotent through stable client ids
  - stale queued deletes for `custom play` and playlist records now return the current backend-backed record so the UI can restore it with explicit warning guidance
- Timer, playlist, history, summary, sankalpa, and custom play flows are implemented in the front end.
- Timer sound playback is now wired for session start, interval cues, and session end in the timer flow.
- Home now adds quick start, last-used, favorite `custom play`, favorite playlist, and concise recent-session shortcuts on iPhone.
- `custom play` now supports a dedicated prerecorded-session runtime with:
  - direct start from Home and Practice
  - resumeable playback state
  - pause, resume, completion, and early-end controls
  - automatic `session log` entries carrying `custom play` context and linked recording metadata
- Playlist runtime now supports:
  - mixed timed items and linked-recording items that reuse saved `custom play` media
  - optional small gaps between playlist items
  - persisted active-run recovery for the current item or gap phase
  - automatic per-item `session log` entries for completion and early-stop outcomes
- Sankalpa management now supports:
  - editing existing goals while preserving the original goal window and id
  - archiving active, completed, or expired goals into a dedicated archived section
  - restoring archived goals back into their derived active, completed, or expired sections
  - deleting archived goals with explicit confirmation and queue-backed stale-delete recovery
  - manual `observance-based` goals for disciplines the app cannot infer from meditation data
  - per-date observance check-ins with observed, missed, and pending states
  - backend-backed archived-state persistence with local cache fallback

## Confirmed Full-Stack Gaps

The current repository still needs all of the following before it can be considered a functioning full-stack app:

- richer media-file management flows beyond seeded metadata and directory conventions

## Planned Full-Stack Target

The chosen target architecture for the next implementation phase is:

- React + TypeScript + Vite front end
- one Spring Boot backend application
- H2 database for local and early deployment persistence
- media files stored under a configured filesystem root
- database rows that reference media by stable ID and relative file path
- REST integration through the existing front-end API-boundary utilities

## What The Application Does

The app supports a focused meditation practice workflow:

- quick start from Home, including last-used meditation and favorite `custom play` / playlist shortcuts
- timer-based meditation sessions
- dedicated `custom play` runtime sessions
- optional start, end, and interval sound selections
- custom plays
- playlists
- automatic and manual session logging
- summaries
- sankalpa goal tracking
  - meditation-derived goals from `session log` history
  - manual observance goals such as brahmacharya or meal cutoffs

Implemented primary screens:

- `/`
- `/practice`
- `/practice/active`
- `/practice/custom-plays/active`
- `/practice/playlists`
- `/practice/playlists/active`
- `/history`
- `/goals`
- `/settings`

Compatibility redirect:

- `/sankalpa` redirects to `/goals`

## Custom Play Media Placement

- Run `./scripts/setup-media-root.sh` to prepare both media roots used by this repo:
  - `local-data/media/custom-plays/` for backend-served development media
  - `public/media/custom-plays/` for frontend-only fallback checks when the backend is not serving media
- The same setup command also prepares timer sound roots:
  - `local-data/media/sounds/`
  - `public/media/sounds/`
- Place local custom-play audio files under `local-data/media/custom-plays/` for backend-served development media.
- The seeded media catalog maps those files to stable media asset ids and relative paths such as `custom-plays/vipassana-sit-20.mp3`.
- Frontend `custom play` entries store the selected `mediaAssetId`; the backend validates that the referenced asset exists and is active before saving.
- For scripted registration and parameter docs, see [docs/media-registration-scripts.md](docs/media-registration-scripts.md).

## Architecture

### High-level architecture

The app is a single-page React application using `BrowserRouter`, a shared `TimerProvider`, and route-level lazy loading for the primary screens.

- Route-level screens live in `src/pages`
- Shared shell/navigation lives in `src/app`
- Feature logic lives in `src/features`
- Shared domain types live in `src/types`
- Pure helpers, storage, validation, and API-boundary utilities live in `src/utils`

### Front-end responsibilities

The front end currently owns all of the following:

- routing and screen composition
- timer and playlist runtime state
- `custom play` runtime playback state
- form validation
- local persistence for playlists, sankalpas, and offline-friendly fallback caches
- sync queue persistence for offline-created or deferred backend writes
- local-first optimistic updates for implemented backend-backed domains while sync is pending
- session log generation
- local summary derivation fallback
- local sankalpa progress fallback and cache migration support
- fallback sample media metadata for custom plays when the backend is unavailable

The key orchestration layer remains `src/features/timer/TimerContext.tsx`, but the provider now delegates bootstrap and recovery helpers to `src/features/timer/timerProviderHelpers.ts` and sync-side effects to `src/features/timer/useTimerSyncEffects.ts` so the public runtime boundary stays stable while the internal responsibilities are smaller and easier to verify.
Shared app-level sync visibility now lives alongside that in `src/features/sync/`, keeping connection state and pending-sync summary work out of route components.
The queue-backed offline behavior now keeps local edits visible immediately and flushes them back through the existing REST boundaries when the backend becomes reachable again.
Backend reachability is now tracked separately from raw browser online state, so the shell can distinguish browser-offline from backend-unavailable conditions.
Summary views and the managed media catalog now keep last-successful browser snapshots so degraded reloads can stay useful after a successful online visit.
The shared shell now also hosts the persistent hidden audio element used to keep active `custom play` media playback and runtime progress aligned across route changes, and it requests bounded offline caching for active recording media.
That offline media policy now caches only a small bounded set of whole-file recording responses and does not fake cached range playback when the browser later asks for byte ranges offline.
Browser storage helpers now live under `src/utils/storage/`, with `src/utils/storage.ts` preserved as a compatibility facade so existing imports and storage keys do not drift during incremental cleanup.

### Back-end responsibilities

The repo now contains a Spring Boot backend foundation under `backend/`.

Current backend endpoints:

- `/api/health`
- `/api/custom-plays`
- `/api/playlists`
- `/api/sankalpas`
- `/api/media/custom-plays`
- `/api/summaries`
- `/api/session-logs/manual`
- `/api/session-logs`
- `/api/settings/timer`

The front end also contains REST-shaped boundary modules used as the integration seam:

- `src/utils/customPlayApi.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/summaryApi.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/timerSettingsApi.ts`

Today:

- `src/utils/customPlayApi.ts` performs live HTTP requests to `/api/custom-plays`
- `src/utils/mediaAssetApi.ts` performs live HTTP requests to `/api/media/custom-plays` through a shared API client
- `src/utils/summaryApi.ts` performs live HTTP requests to `/api/summaries`, sends the browser time zone when available, and supports optional `meditationType` plus `source` filters
- `src/utils/sessionLogApi.ts` creates manual logs through `/api/session-logs/manual`
- `src/utils/sessionLogApi.ts` performs live HTTP requests to `/api/session-logs` and now supports optional date-range, meditation-type, source, and page-size query inputs
- `src/utils/timerSettingsApi.ts` performs live HTTP requests to `/api/settings/timer`
- `src/utils/playlistApi.ts` performs live HTTP requests to `/api/playlists`
- `src/utils/sankalpaApi.ts` performs live HTTP requests to `/api/sankalpas` and sends the browser time zone when available
- `src/features/sankalpa/useSankalpaProgress.ts` hydrates backend sankalpa progress while preserving local cache fallback, id-preserving migration, queued delete replay, and network-only local-save fallback

Stable endpoint contracts in the frontend still include:

- `/api/custom-plays`
- `/api/playlists`
- `/api/sankalpas`
- `/api/media/custom-plays`
- `/api/summaries`
- `/api/session-logs/manual`
- `/api/session-logs`
- `/api/settings/timer`

### Technology stack

- Node.js 20+ recommended
- npm
- React 19
- TypeScript 5
- Vite 6
- React Router 7
- Vitest
- Testing Library
- ESLint

### How the React front end integrates with REST APIs

The frontend now has a shared REST transport foundation, with live backend fetches for the media catalog, `custom play` persistence, playlist persistence, summaries, `session log` history, and timer settings.

Important repo facts:

- `src/utils/apiClient.ts` is the shared typed JSON request layer
- `src/utils/customPlayApi.ts` fetches and persists `/api/custom-plays`
- `src/utils/playlistApi.ts` fetches and persists `/api/playlists`
- `src/utils/mediaAssetApi.ts` fetches `/api/media/custom-plays`
- `src/utils/summaryApi.ts` fetches `/api/summaries`
- `src/utils/sankalpaApi.ts` fetches and persists `/api/sankalpas`
- `vite.config.ts` is the single Vite config and proxies `/api` to the local backend during local development when `VITE_API_BASE_URL` is unset
- backend runtime configuration lives in `backend/src/main/resources/application.yml`

Current API-boundary status:

| File | Exposed contract | Current implementation |
| --- | --- | --- |
| `src/utils/customPlayApi.ts` | `/api/custom-plays` | fetches and persists backend `custom play` records |
| `src/utils/playlistApi.ts` | `/api/playlists` | fetches and persists backend playlist records |
| `src/utils/sankalpaApi.ts` | `/api/sankalpas` | fetches backend `sankalpa` progress and persists `sankalpa` goals |
| `src/utils/mediaAssetApi.ts` | `/api/media/custom-plays` | fetches backend media metadata with built-in sample fallback |
| `src/utils/summaryApi.ts` | `/api/summaries` | fetches backend-derived summary aggregates with optional `meditationType` and `source` filters plus local derived fallback in the UI |
| `src/utils/sessionLogApi.ts` | `/api/session-logs`, `/api/session-logs/manual` | fetches and persists backend session logs, including dedicated manual-log creation plus optional filtered or paged list requests |
| `src/utils/timerSettingsApi.ts` | `/api/settings/timer` | fetches and persists backend timer settings |

This means:

- the front end now sends network traffic for:
  - custom plays
  - playlists
  - sankalpas
  - media catalog
  - summaries
  - session-log history
  - timer settings
- media loading still preserves today’s UX when the backend is unavailable
- `custom play`, playlist, `session log`, and timer-settings hydration still preserve a local cache for smoother migration and failure fallback
- the app now has a shared sync queue foundation for deferred writes when live backend connectivity is not available
- `src/utils/apiClient.ts` now applies an explicit default timeout and separate timeout-versus-abort error classification so backend outages do not look like user cancellations
- implemented write flows now stay usable offline by updating local state first and queueing backend reconciliation for:
  - timer settings
  - session logs
  - custom plays
  - playlists
  - sankalpas
- queued writes are reduced by entity id so stale intermediate edits do not keep replaying after a newer local change exists
- list hydration overlays queued local records so stale backend reads do not immediately erase the latest offline-visible state
- queued flushes now send sync metadata so the backend can safely ignore stale timer-settings, `custom play`, and playlist mutations instead of blindly overwriting newer H2-backed state
- `sankalpa` replay now ignores queue state-only churn, preventing repeated `/api/sankalpas` reloads or failed-entry resets when only retry bookkeeping changes
- `session log` and current `sankalpa` replay continue through id-stable upserts so retries do not duplicate records in the current single-user model
- swapping in the remaining live backend support should continue through these utility modules instead of rewriting screens

### How H2 is used in this project

H2 is now used by the backend foundation in `backend/`.

Current backend persistence foundation includes:

- `backend/src/main/resources/application.yml`
- Flyway migrations in `backend/src/main/resources/db/migration/`
- a file-backed H2 datasource for local development
- an isolated in-memory H2 datasource for tests, with a unique test database name per Spring context
- a disposable temp media root for backend Spring tests so verification does not reuse `local-data/media`

This is now an early feature slice:

- H2 now stores:
  - custom plays
  - playlists and playlist items
  - media metadata
  - sankalpas
  - timer settings
  - session logs
- the front end now consumes backend APIs for:
  - custom plays
  - playlists
  - sankalpas
  - summaries
  - timer settings
  - session logs

## Repository Layout

```text
AGENTS.md                Repo-specific Codex operating rules
PLANS.md                 ExecPlan structure and working rules
README.md                Root workspace map and workflow guide
backend/                 Spring Boot + H2 backend foundation
docs/                    Product, architecture, UX, iOS, and ops docs
ios-native/              Native iPhone app project plus shared core package
prompts/                 Reusable prompt bundles and phased implementation plans
requirements/            Intent, roadmap, decisions, and current-state notes
scripts/                 Setup, media, verification, packaging, and operator helpers
src/
  app/                  App shell and navigation metadata
  features/
    customPlays/        Custom play UI and logic
    playlists/          Playlist management UI
    timer/              Timer context, reducer, constants, runtime helpers
  pages/                Route-level screens
  types/                Shared domain types
  utils/                Validation, persistence, summaries, API boundaries
public/                 Static frontend fallback assets
local-data/             Ignored local runtime state for H2, media, deploy, and build caches
```

## Working In This Repo

### Supported toolchains and environments

- Node.js 20.x via `.nvmrc`
- npm 10 or newer recommended via `package.json` `engines`
- Java 21
- Maven 3.9 or newer
- Xcode with iOS 17 simulator or device support if you are working in `ios-native/`
- Swift 6.3 toolchain support if you are using `swift test --package-path ios-native`
- macOS admin access only if you will run the production install or release flow on a Mac host
- `.editorconfig` is the shared baseline for line endings and indentation across this mixed-language repo

### Daily developer workflow

```bash
npm ci
```

Optional media setup when you need backend-served or fallback local media paths:

```bash
./scripts/setup-media-root.sh
```

Cross-platform verification path:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
cd backend
mvn -Dmaven.repo.local=../local-data/m2 verify
```

The repo also exposes one broader convenience wrapper:

```bash
./scripts/pipeline.sh verify
```

That quality gate runs the frontend checks, backend Maven verify, and a temporary backend health smoke check.
The smoke backend uses disposable runtime, H2, and media directories under the system temp root, so the automated verify flow does not touch `local-data/h2`.

Visible CI and hygiene enforcement now use the same repo surfaces:

- `.github/workflows/ci.yml` runs `./scripts/pipeline.sh verify` on Ubuntu plus native iOS verification on macOS.
- `npm run check:repo-hygiene` runs `./scripts/check-repo-hygiene.sh`, which rejects generated or runtime artifact paths in diffs and accepts `--diff-range` or `--paths` for targeted local checks.

### Native iOS workflow

- App development, simulator builds, device signing, and UI tests:
  - `ios-native/MeditationNative.xcodeproj`
- Shared-core package tests and package metadata:
  - `swift test --package-path ios-native`
- Native setup, simulator, device, and backend-connectivity guidance:
  - [docs/ios-native/README.md](docs/ios-native/README.md)

### macOS-only operator workflow

Use `./scripts/pipeline.sh` as the top-level operator entrypoint for the supported macOS production-style deployment flow:

```bash
./scripts/pipeline.sh help
```

Supported command surface:

| Command | Audience | What it does |
| --- | --- | --- |
| `./scripts/pipeline.sh verify` | contributors and operators | Runs frontend typecheck, lint, test, and build, then backend `mvn verify`, then a temporary backend health smoke check. |
| `./scripts/pipeline.sh build` | operators | Builds the frontend and backend artifacts through the repo's production build flow. |
| `./scripts/pipeline.sh package` | operators | Builds by default, then prepares `local-data/deploy/`. |
| `./scripts/pipeline.sh package --skip-build` | operators | Reuses current build output and refreshes `local-data/deploy/`. |
| `./scripts/pipeline.sh release` | operators | Packages the bundle and installs it on the prepared macOS production host. |
| `./scripts/pipeline.sh release --skip-build --bundle-dir local-data/deploy --domain meditation.example.com --email ops@example.com` | operators | Reinstalls an existing bundle or passes install options through the release flow. |

Recommended operator flow on a prepared Mac host:

```bash
./scripts/setup-media-root.sh
./scripts/pipeline.sh verify
./scripts/pipeline.sh release
```

Use `./scripts/pipeline.sh package` instead of `release` when you only need the assembled bundle under `local-data/deploy/`.

Build and packaging outputs land in:

```text
dist/
backend/target/
local-data/deploy/
```

The `release` command assumes the production Mac host has already been prepared for installation. If you need host setup or post-install operations, use [docs/mac-mini-production-runbook.md](docs/mac-mini-production-runbook.md).

### Environment and configuration variables

There are no required environment variables for the default production path.

Optional example file:

- `.env.example`

Optional production variables:

- `VITE_API_BASE_URL`
  - default behavior when unset: same-origin `/api`
  - keep this unset for the supported nginx-backed production install so the frontend always calls the same origin
- `MEDITATION_BACKEND_BUILD_CMD`
  - optional override for the backend production build command
- `MEDITATION_DEPLOY_DIR`
  - optional deployment bundle output directory for `./scripts/pipeline.sh package` and `./scripts/pipeline.sh release`
- `MEDITATION_BACKEND_BIND_HOST`
  - optional backend bind address for the production backend scripts, generated nginx upstream config, and the local Vite `/api` proxy target when `VITE_API_BASE_URL` is unset
- `MEDITATION_BACKEND_PORT`
  - optional backend port for the packaged backend service, generated nginx upstream config, and the local Vite `/api` proxy target when `VITE_API_BASE_URL` is unset
- `MEDITATION_H2_DB_DIR`
  - optional H2 file directory override
- `MEDITATION_H2_DB_NAME`
  - optional H2 database filename prefix
- `MEDITATION_BACKEND_JAR_PATH`
  - optional jar override for the production backend lifecycle scripts
- `MEDITATION_MEDIA_ROOT`
  - optional frontend fallback media root override for tracked static assets
- `MEDITATION_MEDIA_STORAGE_ROOT`
  - optional backend media-storage root override
- `MEDITATION_NGINX_SERVER_NAME`
  - optional `server_name` value in the generated nginx config
- `MEDITATION_NGINX_LISTEN_PORT`
  - optional `listen` port in the generated nginx config
- `MEDITATION_JAVA_BIN`
  - optional absolute Java executable override for production backend scripts
- `MEDITATION_PROD_APP_ROOT`
  - optional install root override used by `./scripts/pipeline.sh release`
- `MEDITATION_PROD_RUNTIME_DIR`
  - optional runtime directory override used by `./scripts/pipeline.sh release`

Current operational meaning:

- build the frontend as static files
- package the backend as one Spring Boot jar
- serve the frontend and `/api` from the same origin through nginx
- run the backend on loopback behind nginx
- store H2 data and media files on disk under the configured production roots
- keep browser local storage only as a fallback cache and migration source for supported domains

### Default ports and URLs

Current production defaults:

- installed app root: `/opt/meditation`
- public app URL after install: `http://<MAC-LAN-IP>/` or your configured domain
- native iPhone base URL for the supported nginx-backed install: `http://<Mac-Local-Hostname>.local/` or `http://<MAC-LAN-IP>/`
- backend bind URL: `http://127.0.0.1:8080/`
- backend health endpoint: `http://127.0.0.1:8080/api/health`
- backend media catalog endpoint: `http://127.0.0.1:8080/api/media/custom-plays`
- backend API base URL behind nginx: same-origin `/api`

For physical iPhone clients, configure the nginx app origin rather than `http://127.0.0.1:8080` or a raw `:8080` backend URL unless you have explicitly exposed the backend on a LAN-visible port for debugging.

### How the front end is configured to call backend APIs

The frontend uses one shared API-base helper and typed JSON client:

- `src/utils/apiConfig.ts`
- `src/utils/apiClient.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`

Current production behavior:

- endpoint paths resolve to same-origin `/api/...`
- URL builders can still derive fully qualified URLs from `VITE_API_BASE_URL` when explicitly configured
- `mediaAssetApi` performs live fetches and falls back to built-in sample metadata if the backend is unavailable
- playlist and sankalpa persistence use the backend while local caches remain in place for fallback and migration

This keeps the supported deployed runtime shape simple:

- no separate frontend dev proxy in production
- no preview server
- no CORS split between UI and API in the supported deployment

Local development still uses the checked-in Vite `/api` proxy in [vite.config.ts](vite.config.ts) when `VITE_API_BASE_URL` is unset.

## Current Persistence Model

### Browser storage

The app currently persists data in `localStorage` using these keys:

- `meditation.timerSettings.v1`
- `meditation.sessionLogs.v1`
- `meditation.customPlays.v1`
- `meditation.playlists.v1`
- `meditation.sankalpas.v1`
- `meditation.lastUsedMeditation.v1`
- `meditation.activeTimerState.v1`
- `meditation.activePlaylistRunState.v1`

These keys are defined in `src/utils/storage.ts`.

### Start with a clean local state

Browser storage is no longer the system of record, but it still acts as a fallback cache and migration source for some flows. If you need to clear the frontend cache on one device, clear the `meditation.*` keys in that browser.

Manual option:

1. Open the app in the browser.
2. Open DevTools.
3. Clear `localStorage` entries whose keys start with `meditation.`.
4. Refresh the app.

Equivalent DevTools console snippet:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith('meditation.'))
  .forEach((key) => localStorage.removeItem(key));
```

## Database And H2

### Where H2 is configured

H2 is configured in:

- `backend/src/main/resources/application.yml`

Flyway schema lives in:

- `backend/src/main/resources/db/migration/V1__create_core_reference_and_domain_tables.sql`
- `backend/src/main/resources/db/migration/V2__seed_reference_data.sql`

### How to start with a clean DB

The supported production-first flow is to point H2 at the desired runtime directory through the production environment file and reinstall or restart the backend. There is no longer a repo reset helper for destructive local database wipes.

If you intentionally want a clean database:

1. Stop the installed backend service.
2. Remove the H2 files from the configured `MEDITATION_H2_DB_DIR`.
3. Start the backend again so Flyway recreates schema and seed data.

### Where the schema lives

- `backend/src/main/resources/db/migration/V1__create_core_reference_and_domain_tables.sql`
- `backend/src/main/resources/db/migration/V2__seed_reference_data.sql`

### Where seed or sample data lives

The backend now seeds:

- meditation types
- sample custom-play media metadata

Current reference or sample data also still exists in TypeScript modules:

- meditation types: `src/types/referenceData.ts` and `src/features/timer/constants.ts`
- timer sound labels and playback ownership: `src/data/timerSoundCatalog.json`, `src/utils/timerSound.ts`, and `src/features/timer/timerSoundCatalog.ts`
- fallback custom-play media metadata used only when the backend is unavailable: `src/data/customPlayMediaCatalog.json`

### How the app stores media metadata today

There is now a backend DB-backed media metadata model, and the frontend custom-play media flow prefers it.

Current behavior:

- `backend` stores seeded media metadata rows in H2 `media_asset`
- backend migrations store relative media paths such as `custom-plays/vipassana-sit-20.mp3`
- backend API responses expose public media paths such as `/media/custom-plays/vipassana-sit-20.mp3`
- the backend serves `/media/custom-plays/**` and `/media/sounds/**` from validated child directories under the configured media root
- `src/data/customPlayMediaCatalog.json` contains the built-in sample fallback catalog for backend-unavailable cases
- each media entry has:
  - `id`
  - `label`
  - `filePath`
  - `durationSeconds`
  - `mimeType`
  - `sizeBytes`
  - `updatedAt`
- when a user saves a custom play, the app persists only:
  - `mediaAssetId`

Today the backend media API is the preferred source of truth for linked media shown in the UI, while the frontend sample catalog remains a resilience fallback.

### Current model vs intended backend model

Current implemented model:

- `TimerSettings`
- `SessionLog`
- `CustomPlay`
- `Playlist`
- `PlaylistItem`
- `SankalpaGoal`
- `MediaAssetMetadata`

Intended backend/H2 model, inferred from the current front-end domain types and API seams, would likely need tables or entities comparable to:

- `meditation_type` lookup or equivalent enum mapping
- `sound_option` lookup or equivalent enum mapping
- `media_asset`
- `custom_play`
- `playlist`
- `playlist_item`
- `session_log`
- `sankalpa_goal`

The backend foundation now includes schema, seeded reference data, and the live APIs used by the current frontend.

## Media Files And Storage

### Current state

Important current limitations:

- browser autoplay policies can still block timer sounds until the user starts a session with an allowed interaction
- browser autoplay policies can still block linked playlist or `custom play` recordings until the user resumes playback from an allowed interaction

The concrete media-path conventions currently used in code are:

- `src/utils/mediaAssetApi.ts` defines `CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays'`
- backend media metadata responses use that same public path prefix
- shipped timer sounds resolve from inline-bundled frontend assets under `src/assets/sounds/`
- script-managed timer sounds resolve from `/media/sounds/<filename>` and are mirrored under the backend and optional public media roots
- backend media storage serves `/media/custom-plays/**` for custom-play files and `/media/sounds/**` for script-managed sound files

### Exact directory structure to use for custom play media

`npm run media:setup` prepares both directory trees below so local verification starts from the right paths.

Place backend-served media files under the backend media root:

```text
local-data/
  media/
    custom-plays/
      vipassana-sit-20.mp3
      ajapa-breath-15.mp3
      tratak-focus-10.mp3
```

Tracked fallback copies may also exist under `public/` so packaged frontend builds include backend-unavailable custom-play checks and any script-managed timer sounds:

```text
public/
  media/
    custom-plays/
      vipassana-sit-20.mp3
      ajapa-breath-15.mp3
      tratak-focus-10.mp3
    sounds/
      crystal-bowl.wav
```

Why there are two useful locations:

- the backend now serves `/media/custom-plays/**` and `/media/sounds/**` from validated child directories under `local-data/media` by default
- the packaged frontend build includes `public/` assets as static files when an operator wants the same repo-local fallback path
- `npm run media:setup` mirrors any tracked `public/media/sounds/` files into `local-data/media/sounds/` for backend-served parity
- the built-in shipped timer sounds stay bundled from `src/assets/sounds/` and no longer rely on tracked `public/media/sounds/` copies

### How media file paths are referenced in H2

Backend convention:

- H2 stores a relative path in `media_asset.relative_path`
- backend responses expose a web path such as `/media/custom-plays/vipassana-sit-20.mp3`
- media files are intended to live under the configured media root plus the `custom-plays/` subdirectory

### How media file paths are referenced today

Custom play media paths are referenced in two places today:

1. In backend-seeded `media_asset` rows created by Flyway
2. In the frontend fallback metadata catalog in `src/data/customPlayMediaCatalog.json`

Example stored value:

```text
/media/custom-plays/vipassana-sit-20.mp3
```

That is a root-relative URL path, not an absolute filesystem path.

### Are media files served statically or via backend endpoints

Current answer:

- the backend now serves only `/media/custom-plays/**` and `/media/sounds/**` from validated child directories beneath the configured media root
- the packaged frontend may include matching `public/` files as static assets for fallback custom-play files or script-managed timer sounds
- timer playback uses inline-bundled shipped sounds for `Temple Bell` and `Gong`

The app now plays managed custom-play media files in the dedicated `custom play` runtime and through linked playlist recording items. This registration flow still concerns metadata, linking, and file placement rather than browser upload/import.

### Does the DB store file paths, relative paths, or URLs

The backend DB stores relative paths.

Current frontend custom play records still store only `mediaAssetId`, and the UI still resolves display details from the sample catalog.

### How to register or link a media file so the app can use it

For the current backend-backed foundation, the registration flow is:

1. Run `npm run media:add:custom-play -- --help` to review the parameters.
2. Register the asset with `npm run media:add:custom-play -- ...`.
3. Rebuild and reinstall with `./scripts/pipeline.sh release`, or restart the installed backend if you only changed backend-served media metadata.
4. Open `Practice` -> `Show Tools` -> `Custom Plays`.
5. Select the entry from `Media session (optional)`.
6. Save a custom play.

Current fallback-only shortcut:

1. Use `npm run media:add:custom-play -- ... --skip-frontend-copy` only if you explicitly do not want the packaged frontend fallback copy.
2. Otherwise let the script mirror the file into `public/media/custom-plays/` for backend-unavailable fallback behavior.

What "use it" means today:

- the media entry appears in the dropdown
- the linked media session appears in the custom play UI
- the custom play persists the media reference by id

What it does not mean yet:

- the registration flow itself does not preview or upload the media file
- the app does not validate the file contents
- the app does not upload or import media

### How media files map to app enumerations or options

There are two separate concepts in the current code:

1. Timer sound options
   - defined by `src/data/timerSoundCatalog.json` and exposed through `src/features/timer/constants.ts`
   - the silent `None` option is derived at runtime and never maps to a file
   - each catalog entry explicitly declares whether the file is `bundled` or `media` backed
   - values:
     - `None`
     - `Temple Bell`
     - `Gong`
   - used by timer setup, settings, custom plays, and session logs
   - resolved at runtime through the shared timer sound catalog
   - `None` remains silent and never loads a file

2. Custom play media sessions
   - defined primarily by backend metadata responses
   - backed by fallback metadata entries in `src/data/customPlayMediaCatalog.json` when the backend is unavailable
   - selected by `mediaAssetId`
   - persisted into custom plays as `mediaAssetId`

### Naming conventions

Current code conventions suggest:

- media asset ids: prefix with `media-`, for example `media-vipassana-sit-20`
- filenames: lowercase kebab-case, for example `vipassana-sit-20.mp3`
- paths: root-relative under `/media/custom-plays`
- labels: human-readable practice-facing titles, for example `Vipassana Sit (20 min)`
- timer sound filenames: lowercase kebab-case, for example `temple-bell.mp3`

### Supported formats

Current shipped entries use:

- timer sounds:
  - file extension: `.mp3`
  - bundled inline in the frontend for shipped sounds
- custom play media:
  - file extension: `.mp3`
  - MIME type: `audio/mpeg`

No runtime validation enforces a single timer-sound format yet, but the current shipped timer sounds use `.mp3` and the current custom-play media catalog also uses `.mp3`.

### Example: add a new custom play media file end to end

1. Run:

```bash
npm run media:add:custom-play -- \
  --id media-sahaj-evening-25 \
  --label "Sahaj Evening Sit (25 min)" \
  --meditation-type Sahaj \
  --file /absolute/path/to/sahaj-evening-25.mp3 \
  --duration-minutes 25
```

2. Rebuild and reinstall the production app:

```bash
./scripts/pipeline.sh release
```

3. In the UI, go to `Practice` -> `Show Tools` -> `Custom Plays`.

4. Create or edit a custom play and choose `Sahaj Evening Sit (25 min)` from `Media session (optional)`.

5. Save the custom play and confirm the UI shows:

- the media session label
- a linked media session reference for the saved custom play

6. Optional backend media-path check:

Open `http://127.0.0.1:8080/media/custom-plays/sahaj-evening-25.mp3` on the production host, or the same path through the installed app origin if nginx is proxying `/media`.

Current limitation:

- this proves the file path is reachable as a backend-served media asset
- it still does not make the timer or playlist play the file automatically

## Configuration And Extensibility

### Add a new meditation type

Current implementation requires changes in multiple places because meditation type is a strict union plus a validated persisted value.

Update all of the following:

1. Add the new union member in `src/types/timer.ts`
2. Add the new option in `src/features/timer/constants.ts`
3. Update the `MEDITATION_TYPES` validation list in `src/utils/storage.ts`
4. Run tests and fix any type-exhaustiveness failures

Why multiple files:

- `MeditationType` is a TypeScript union
- UI select options come from `meditationTypes`
- persisted data is normalized against the storage validation list

### Add a new sound option

Current scripted flow:

1. Review the CLI:

```bash
npm run sound:add -- --help
```

2. Add a playable sound with a file copy:

```bash
npm run sound:add -- \
  --label "Crystal Bowl" \
  --file /absolute/path/to/crystal-bowl.wav
```

3. Or add the label plus mapping when the file is already staged:

```bash
npm run sound:add -- \
  --label "Crystal Bowl" \
  --filename crystal-bowl.wav
```

4. Update `defaultTimerSettings` in `src/features/timer/constants.ts` only if you want it to become a default.
5. Run tests.

The UI will automatically expose the new option in:

- Practice timer setup
- Settings
- Custom Plays

The timer playback mapping will update automatically, using:

- [src/data/timerSoundCatalog.json](src/data/timerSoundCatalog.json)

Current limitations:

- browser autoplay rules can still block playback until the session is started through an allowed user interaction
- playlist runs reuse these sound labels only through linked `custom play` recordings, not as standalone timer-style cues for timed playlist items

### Example: add a new sound option in the current repo

Run:

```bash
npm run sound:add -- \
  --label "Crystal Bowl" \
  --file /absolute/path/to/crystal-bowl.wav
```

What happens immediately:

- `Crystal Bowl` appears in the relevant selects
- saved timer settings, session logs, and custom plays can store that string
- `src/data/timerSoundCatalog.json` maps it to `/media/sounds/crystal-bowl.wav` with explicit `media` ownership
- the file is copied to:
  - `public/media/sounds/crystal-bowl.wav`
  - `local-data/media/sounds/crystal-bowl.wav`

What still may not happen:

- the browser may still block playback if it rejects audio for the current interaction context
- timed-only playlist items still do not synthesize separate timer-style cue playback from this sound-registration flow

### Add a new enum-backed option and wire it through backend, database, API, and front end

Current repo support:

- you can wire the front-end type, UI, validation, storage normalization, and tests here
- you can extend the backend schema, reference data, and REST foundation in `backend/`
- you still cannot finish end-to-end feature wiring without adding the specific domain API and front-end transport layer for that feature

Front-end checklist for enum-backed additions:

1. Update the shared type in `src/types`
2. Update any UI option list in `src/features/.../constants.ts`
3. Update persistence normalization and validation in `src/utils/storage.ts`
4. Update any helper logic in `src/utils`
5. Add or update focused tests

Backend/H2 work that may still be required in this repo:

- database enum or lookup table updates
- Flyway migration changes
- REST contract updates
- server-side validation
- seed or reference-data updates

### Update seed or reference data

The backend now has a Flyway seed layer for meditation types and sample media metadata.

Current shared reference data is maintained in stable source modules rather than repeated ad hoc arrays:

- frontend meditation types, `session log` sources, and time-of-day buckets: [src/types/referenceData.ts](src/types/referenceData.ts)
- backend meditation types, `session log` sources, time-of-day buckets, and validation helpers: [backend/src/main/java/com/meditation/backend/reference/ReferenceData.java](backend/src/main/java/com/meditation/backend/reference/ReferenceData.java)
- backend meditation-type seed alignment coverage: [backend/src/test/java/com/meditation/backend/reference/ReferenceDataSeedTest.java](backend/src/test/java/com/meditation/backend/reference/ReferenceDataSeedTest.java)
- timer sound catalog and selectable labels: [src/data/timerSoundCatalog.json](src/data/timerSoundCatalog.json), [src/utils/timerSound.ts](src/utils/timerSound.ts), and [src/features/timer/timerSoundCatalog.ts](src/features/timer/timerSoundCatalog.ts)
- fallback custom-play media catalog: `src/data/customPlayMediaCatalog.json`

### Validate that a new media file is visible and usable

For the current implementation, validate in this order:

1. Ensure the file exists under `local-data/media/custom-plays/` for backend-backed verification.
2. If you also want the file shipped with the packaged frontend fallback assets, mirror it under `public/media/custom-plays/`.
3. Ensure the backend media metadata includes the file path you expect.
4. Rebuild and reinstall with `./scripts/pipeline.sh release`.
5. Confirm the item appears in the `Media session (optional)` dropdown.
6. Save a custom play using it.
7. Confirm the saved custom play shows the media session label.
8. Optionally open the backend media URL in the browser.

"Usable" currently means linked-media selection and reference visibility, not playback.

## Testing And Verification

### Install and quality checks

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Backend verification:

```bash
cd backend
mvn -Dmaven.repo.local=../local-data/m2 test
mvn -Dmaven.repo.local=../local-data/m2 verify
```

Backend Spring tests run with the `test` profile, which uses isolated in-memory H2 plus a disposable temp media root by default rather than the file-backed `local-data/h2` runtime.

### Unit and integration tests

The repo uses Vitest for both unit-style and App-level integration tests.

Run all tests:

```bash
npm run test
```

Representative test areas:

- validation helpers in `src/utils/*.test.ts`
- storage normalization in `src/utils/storage.test.ts`
- timer state logic in `src/features/timer/*.test.ts`
- route/page behavior in `src/pages/*.test.tsx`
- App-level journey checks in `src/App.test.tsx`

### End-to-end tests

There is no separate Playwright or Cypress test suite in this repo today.

The closest coverage is:

- App-level Vitest flows in `src/App.test.tsx`
- production build verification with `./scripts/pipeline.sh build`
- packaged runtime verification through the production install flow

### Verify media files and configuration

Current manual verification checklist:

1. Run `./scripts/pipeline.sh release`
2. Confirm `http://127.0.0.1:8080/media/custom-plays/vipassana-sit-20.mp3` is reachable on the host when a matching file exists under the backend media root
3. Open `Practice` -> `Show Tools` -> `Custom Plays`
4. Confirm expected media entries appear in the dropdown
5. Save a custom play and confirm the linked media label is rendered
6. Confirm `Temple Bell` and `Gong` play from the packaged frontend without separate `/media/sounds/...` requests

### Verify REST APIs are reachable

The backend foundation exposes reachable REST endpoints now:

- `GET /api/health`
- `GET /api/playlists`
- `GET /api/media/custom-plays`
- `GET /api/sankalpas`
- `GET /api/summaries`

What is still true today:

- the frontend now calls the media catalog endpoint
- the sankalpa front-end API module now performs live REST requests with local cache fallback
- backend-backed `summary` and `sankalpa` time-of-day behavior can take the browser's IANA time zone when available
- `sankalpa` saves only fall back to local persistence when the backend is unreachable; backend validation failures stay as inline errors

What you can verify today:

- shared HTTP request behavior is covered in:
  - `src/utils/apiClient.test.ts`
- API base-path and URL-building behavior remain stable in:
  - `src/utils/apiConfig.test.ts`
- endpoint contract strings remain stable in:
  - `src/utils/playlistApi.test.ts`
  - `src/utils/sankalpaApi.test.ts`
  - `src/utils/mediaAssetApi.test.ts`
- backend media connectivity can be checked directly on the host:
  - `curl -s http://127.0.0.1:8080/api/media/custom-plays`

### Verify front-end / back-end connectivity

You can verify backend reachability in this workspace now, plus the frontend media integration path.

Current verification split:

1. For the portable contributor quality gate, run `./scripts/pipeline.sh verify` and use the direct API checks above when you already have a backend running.
2. `./scripts/pipeline.sh verify` prints the disposable runtime, H2, and media directories it created for the smoke backend so you can confirm the automated flow stayed off the persistent runtime paths.
3. Use the following end-to-end connectivity path only for the macOS production-style install flow.
4. Run `./scripts/pipeline.sh release`.
5. Open `http://127.0.0.1:8080/api/health`.
6. Open `http://127.0.0.1:8080/api/media/custom-plays`.
7. Open `http://127.0.0.1:8080/media/custom-plays/vipassana-sit-20.mp3` when a matching file exists under the backend media root.
8. Open the installed app through nginx.
9. In the app, start a short timer with `Temple Bell` and `Gong`, then confirm sounds fire once at start, each interval milestone, and session end without a CORS dependency.
10. In the app, open `Practice` -> `Show Tools` -> `Custom Plays` and confirm media options load with the backend running.
11. Save a custom play or session log and confirm it persists across a clean service restart.

## Build And Deployment

Use the pipeline commands from [Working In This Repo](#working-in-this-repo) for builds and releases:

```bash
./scripts/pipeline.sh verify
./scripts/pipeline.sh build
./scripts/pipeline.sh package
./scripts/pipeline.sh release
```

For host-specific setup and post-install operations, see [docs/mac-mini-production-runbook.md](docs/mac-mini-production-runbook.md).

### Static assets and media in deployment

Current repo behavior:

- if you add files under `public/`, Vite will include them as static assets in the build output
- the custom play media catalog already expects paths under `/media/custom-plays`
- backend media storage expects filesystem content under the configured media root, outside the database

Operational implication:

- if you deploy the backend, place real custom-play media files under the configured backend media root so `/media/custom-plays/**` resolves correctly, and place script-managed sounds under the sibling `sounds/` directory for `/media/sounds/**`
- if you are running frontend-only static checks, `public/` assets still work for Vite-served local development

### Runtime configuration required in deployment

Current likely runtime configuration:

- frontend:
  - optional `VITE_API_BASE_URL`
- backend:
  - `MEDITATION_BACKEND_BIND_HOST`
  - `MEDITATION_BACKEND_PORT`
  - `MEDITATION_H2_DB_DIR`
  - `MEDITATION_H2_DB_NAME`
  - `MEDITATION_MEDIA_STORAGE_ROOT`
  - `MEDITATION_BACKEND_JAR_PATH`
  - `MEDITATION_RUNTIME_DIR`
  - `MEDITATION_JAVA_BIN`
- nginx bundle generation:
  - `MEDITATION_DEPLOY_DIR`
  - `MEDITATION_NGINX_SERVER_NAME`
  - `MEDITATION_NGINX_LISTEN_PORT`
- macOS production installer:
  - `MEDITATION_PROD_APP_ROOT`
  - `MEDITATION_PROD_RUNTIME_DIR`

Optional build-time override when pairing the built front end with a separate backend:

- `VITE_API_BASE_URL=http://<HOST>:<PORT>/api`

### Known limitations and TODOs

- playlist item runtime audio now works for linked `custom play` recordings, but timer-style sound cues inside playlist runs remain limited to the linked recording's own start/end sounds or silent timed items
- custom-play media falls back to built-in sample metadata and is not yet a user-managed library
- browser-automation coverage for the goals-screen archive/delete confirmation UX is still absent

## Operator Notes

For someone trying to configure, run, or deploy this project today, the correct mental model is:

- this repo is operational as:
  - a frontend app
  - a meaningful local full-stack vertical slice
- it is not yet operational as a fully rounded production full-stack product
- browser local storage remains a fallback cache and migration source for some feature flows
- backend REST + H2 now back the main timer, history, playlist, summary, custom play, and sankalpa slices in local development

## Verification Snapshot

The repo’s required quality commands are:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Backend verification for the in-repo Spring Boot module is also required for meaningful full-stack changes:

```bash
cd backend
mvn -Dmaven.repo.local=../local-data/m2 test
mvn -Dmaven.repo.local=../local-data/m2 verify
```

Use those commands before handing off documentation or behavior changes.
