# Meditation App

Calm, minimal meditation practice app built with React, TypeScript, and Vite.

This README is intentionally grounded in the current repository contents. It explains what exists today, what is only planned, and where the operational gaps still are.

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
- Timer sound selections exist in the UI, but actual audio playback is still not implemented.

## Confirmed Full-Stack Gaps

The current repository still needs all of the following before it can be considered a functioning full-stack app:

- richer media-file management flows beyond seeded metadata and directory conventions
- deeper sankalpa management beyond create/list progress flows, such as edit/archive behavior

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

- quick start from Home
- timer-based meditation sessions
- optional start, end, and interval sound selections
- custom plays
- playlists
- automatic and manual session logging
- summaries
- sankalpa goal tracking

Implemented primary screens:

- `/`
- `/practice`
- `/practice/active`
- `/practice/playlists`
- `/practice/playlists/active`
- `/history`
- `/goals`
- `/settings`

Compatibility redirect:

- `/sankalpa` redirects to `/goals`

## Custom Play Media Placement

- Run `npm run media:setup` to prepare both media roots used by this repo:
  - `local-data/media/custom-plays/` for backend-served development media
  - `public/media/custom-plays/` for frontend-only fallback checks when the backend is not serving media
- Place local custom-play audio files under `local-data/media/custom-plays/` for backend-served development media.
- The seeded media catalog maps those files to stable media asset ids and relative paths such as `custom-plays/vipassana-sit-20.mp3`.
- Frontend `custom play` entries store the selected `mediaAssetId`; the backend validates that the referenced asset exists and is active before saving.
- For scripted registration and parameter docs, see [docs/media-registration-scripts.md](/Users/prashantwani/wrk/meditation/docs/media-registration-scripts.md).

## Architecture

### High-level architecture

The app is a single-page React application using `BrowserRouter` and a shared `TimerProvider`.

- Route-level screens live in `src/pages`
- Shared shell/navigation lives in `src/app`
- Feature logic lives in `src/features`
- Shared domain types live in `src/types`
- Pure helpers, storage, validation, and API-boundary utilities live in `src/utils`

### Front-end responsibilities

The front end currently owns all of the following:

- routing and screen composition
- timer and playlist runtime state
- form validation
- local persistence for playlists, sankalpas, and offline-friendly fallback caches
- sync queue persistence for offline-created or deferred backend writes
- local-first optimistic updates for implemented backend-backed domains while sync is pending
- session log generation
- local summary derivation fallback
- local sankalpa progress fallback and cache migration support
- fallback sample media metadata for custom plays when the backend is unavailable

The key orchestration layer is `src/features/timer/TimerContext.tsx`, which hydrates local state, persists it, and coordinates timer, playlist, custom play, and session log behavior.
Shared app-level sync visibility now lives alongside that in `src/features/sync/`, keeping connection state and pending-sync summary work out of route components.
The queue-backed offline behavior now keeps local edits visible immediately and flushes them back through the existing REST boundaries when the backend becomes reachable again.

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
- `src/utils/summaryApi.ts` performs live HTTP requests to `/api/summaries` and sends the browser time zone when available
- `src/utils/sessionLogApi.ts` creates manual logs through `/api/session-logs/manual`
- `src/utils/sessionLogApi.ts` performs live HTTP requests to `/api/session-logs`
- `src/utils/timerSettingsApi.ts` performs live HTTP requests to `/api/settings/timer`
- `src/utils/playlistApi.ts` performs live HTTP requests to `/api/playlists`
- `src/utils/sankalpaApi.ts` performs live HTTP requests to `/api/sankalpas` and sends the browser time zone when available
- `src/features/sankalpa/useSankalpaProgress.ts` hydrates backend sankalpa progress while preserving local cache fallback, id-preserving migration, and network-only local-save fallback

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
- `vite.config.ts` and `vite.config.js` now proxy `/api` to the local backend when `VITE_API_BASE_URL` is unset
- backend runtime configuration lives in `backend/src/main/resources/application.yml`

Current API-boundary status:

| File | Exposed contract | Current implementation |
| --- | --- | --- |
| `src/utils/customPlayApi.ts` | `/api/custom-plays` | fetches and persists backend `custom play` records |
| `src/utils/playlistApi.ts` | `/api/playlists` | fetches and persists backend playlist records |
| `src/utils/sankalpaApi.ts` | `/api/sankalpas` | fetches backend `sankalpa` progress and persists `sankalpa` goals |
| `src/utils/mediaAssetApi.ts` | `/api/media/custom-plays` | fetches backend media metadata with built-in sample fallback |
| `src/utils/summaryApi.ts` | `/api/summaries` | fetches backend-derived summary aggregates with local derived fallback in the UI |
| `src/utils/sessionLogApi.ts` | `/api/session-logs`, `/api/session-logs/manual` | fetches and persists backend session logs, including dedicated manual-log creation |
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
- an in-memory H2 datasource for tests

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
src/
  app/                  App shell and navigation metadata
  features/
    customPlays/        Custom play UI and logic
    playlists/          Playlist management UI
    timer/              Timer context, reducer, constants, runtime helpers
  pages/                Route-level screens
  types/                Shared domain types
  utils/                Validation, persistence, summaries, API boundaries
docs/                   Product, architecture, UX, and review docs
requirements/           Decisions, handoff, roadmap, ExecPlans
backend/                Spring Boot + H2 backend foundation
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer recommended
- Java 21
- Maven 3.9 or newer
- a modern desktop browser

### Install

```bash
npm ci
```

Backend dependencies are resolved when you first run the backend commands.

### Prepare local media root

```bash
npm run media:setup
```

This prepares both media directories used by the repo:

- `public/media/custom-plays/` for frontend-only fallback checks
- `local-data/media/custom-plays/` for backend-served media files

### Run the front end

```bash
npm run dev:frontend
```

The Vite dev server is configured to bind to the local network on port `5173`.

Open:

- on the developer machine: `http://localhost:5173/`
- on other devices on the same Wi-Fi: `http://<LAN-IP>:5173/`

Notes:

- the backend CORS allowlist already supports the local dev and preview ports used by this repo:
  - `5173`
  - `5174`
  - `4173`
  - `4174`
- if you need an isolated local full-stack run without using the default frontend port, prefer `5174` over an arbitrary port so the existing backend CORS config continues to work without extra changes
- for an isolated frontend run pointed at a non-default backend port, this prompt verified:

```bash
VITE_DEV_BACKEND_ORIGIN=http://127.0.0.1:8081 npm run dev -- --host 127.0.0.1 --port 5174
```

### Run the back end

The repo now includes an in-repo backend module under `backend/`.

The cleanest way to start it is:

```bash
npm run dev:backend
```

Default behavior:

- the root helper auto-detects `backend/pom.xml`
- the default backend command is `mvn -Dmaven.repo.local=../local-data/m2 spring-boot:run -Dspring-boot.run.profiles=dev`
- the backend listens on port `8080` unless `MEDITATION_BACKEND_PORT` is set

For an isolated local verification run that does not reuse the default H2 file or backend port, this prompt verified:

```bash
MEDITATION_H2_DB_NAME=meditation-prompt04 MEDITATION_BACKEND_PORT=8081 npm run dev:backend
```

You can still override the backend location or command through `.env.local` if you later split the backend into another workspace.

### Run both together

Use the app-level helper:

```bash
npm run dev:all
```

Behavior:

- always prepares both media roots
- starts the front end
- starts the in-repo backend by default when `backend/pom.xml` is present
- still supports an overridden external backend command when explicitly configured

### Start and stop the managed local stack

Use the managed stack helpers when you want background processes, PID files, health checks, and logs:

```bash
npm run start:app
npm run status:app
npm run logs:app -- --tail 40
npm run restart:app
npm run restart:app -- --no-db
npm run stop:app
```

Behavior:

- `npm run start:app`
  - prepares both media roots
  - starts the backend dev server in the background
  - waits for backend health before starting the frontend dev server
  - writes PID files and logs under `local-data/runtime/`
- `npm run stop:app`
  - stops only the managed frontend and backend processes started by `npm run start:app`
- `npm run restart:app`
  - restarts the managed frontend and backend together
- `npm run restart:app -- --no-db`
  - restarts only the frontend so the current backend process and embedded H2 state stay up
  - this repo uses file-backed H2 inside the backend process, so there is no separate DB daemon to restart independently
- `npm run status:app`
  - shows managed PID, URL, health, and log-path details
- `npm run logs:app`
  - tails the managed frontend and backend logs

### Environment and configuration variables

There are no required environment variables for the default local workflow.

An optional example file is included:

- `.env.example`

Optional variables:

- `VITE_API_BASE_URL`
  - default behavior when unset: same-origin `/api`
  - in local frontend development, Vite proxies `/api` to the backend origin
  - use this when you are pairing the front end with a separate backend host or port, including LAN testing
  - example LAN override: `VITE_API_BASE_URL=http://192.168.1.50:8080/api`
- `VITE_DEV_BACKEND_ORIGIN`
  - used only by the Vite dev proxy when `VITE_API_BASE_URL` is unset
  - default: `http://127.0.0.1:8080`
  - example override: `VITE_DEV_BACKEND_ORIGIN=http://127.0.0.1:9090`
- `MEDITATION_BACKEND_DIR`
  - optional override for backend workspace location
- `MEDITATION_BACKEND_DEV_CMD`
  - optional override for backend local-dev startup
- `MEDITATION_BACKEND_BUILD_CMD`
  - optional override for backend build
- `MEDITATION_RUNTIME_DIR`
  - optional runtime directory for managed PID files and logs
- `MEDITATION_FRONTEND_DEV_HOST`
  - optional host override for `npm run dev:frontend` and `npm run start:app`
- `MEDITATION_FRONTEND_DEV_PORT`
  - optional port override for `npm run dev:frontend` and `npm run start:app`
- `MEDITATION_FRONTEND_PREVIEW_HOST`
  - optional host override for `npm run preview:app`
- `MEDITATION_FRONTEND_PREVIEW_PORT`
  - optional port override for `npm run preview:app`
- `MEDITATION_H2_DB_DIR`
  - optional H2 file directory for reset/init helper flows
- `MEDITATION_H2_DB_NAME`
  - optional H2 database filename prefix
- `MEDITATION_MEDIA_ROOT`
  - optional frontend fallback media root override
- `MEDITATION_MEDIA_STORAGE_ROOT`
  - optional backend media-storage root override

Code audit results:

- no `.env` file is present
- no `process.env` frontend config exists
- backend runtime configuration now lives in `backend/src/main/resources/application.yml`

Current operational meaning:

- install dependencies
- optionally prepare both media roots:
  - `public/media/custom-plays`
  - `local-data/media/custom-plays`
- start Vite
- start Spring Boot + H2 from `backend/`
- use backend + H2 persistence for:
  - custom plays
  - playlists
  - sankalpas
  - timer settings
  - session logs
- fetch custom-play media metadata from the backend when available
- keep browser local storage as a migration/fallback cache for custom plays, playlists, sankalpas, timer settings, and session logs
- keep the sync queue available for deferred offline writes across the implemented backend-backed domains
- optionally override the API base with `VITE_API_BASE_URL`

### App-level helper commands

Use these commands for the cleanest local workflow:

```bash
npm run media:setup
npm run sound:add -- --help
npm run media:add:custom-play -- --help
npm run dev:frontend
npm run dev:backend
npm run dev:all
npm run build:app
npm run start:app
npm run stop:app
npm run restart:app
npm run status:app
npm run logs:app
npm run preview:app
npm run db:h2:reset
```

What they do:

- `npm run media:setup`
  - ensures both the frontend fallback and backend-served custom-play media roots exist
- `npm run sound:add -- --help`
  - shows the CLI for adding a selectable timer sound label
- `npm run media:add:custom-play -- --help`
  - shows the CLI for registering a prerecorded `custom play` meditation asset
- `npm run dev:frontend`
  - prepares the media root and starts the Vite dev server
- `npm run dev:backend`
  - runs the in-repo backend by default and still allows explicit overrides
  - starts the backend with the `dev` profile so local-only developer surfaces stay available without being part of the default runtime
- `npm run dev:all`
  - starts the frontend plus the backend
- `npm run build:app`
  - builds the frontend and runs backend verification/package work
- `npm run start:app`
  - starts the managed frontend and backend in the background and records runtime state under `local-data/runtime`
- `npm run stop:app`
  - stops the managed frontend and backend
- `npm run restart:app`
  - restarts the managed frontend and backend
  - pass `-- --no-db` to leave the current backend process and embedded H2 state running while cycling only the frontend
- `npm run status:app`
  - prints the managed process, health, and log status
- `npm run logs:app`
  - tails the managed process logs
- `npm run preview:app`
  - rebuilds the frontend and starts a production-like Vite preview server
- `npm run db:h2:reset`
  - prepares a local H2 directory and clears the configured H2 files for paired-backend workflows

Important note:

- H2 reset clears the local DB files; Flyway recreates schema on the next backend startup

### Default ports and URLs

Current repo defaults:

- front end dev server: `http://localhost:5173/` on the developer machine, `http://<LAN-IP>:5173/` from other devices
- front end preview server: `http://localhost:4173/` on the developer machine, `http://<LAN-IP>:4173/` from other devices
- backend server: `http://localhost:8080/`
- backend health endpoint: `http://localhost:8080/api/health`
- backend media catalog endpoint: `http://localhost:8080/api/media/custom-plays`
- backend media path example: `http://localhost:8080/media/custom-plays/vipassana-sit-20.mp3`
- backend H2 console in `dev` profile only: `http://localhost:8080/h2-console`
- backend API base URL: `http://localhost:8080/api`
- frontend API path during Vite dev: `/api` through the local dev proxy when `VITE_API_BASE_URL` is unset
- frontend API path during Vite preview: use a build created with `VITE_API_BASE_URL=http://<HOST>:<PORT>/api`, or serve the built frontend and backend from the same origin in a real deployment

### How the front end is configured to call backend APIs

The frontend now uses one shared API-base helper and typed JSON client:

- `src/utils/apiConfig.ts`
- `src/utils/apiClient.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`

Current behavior:

- stable same-origin endpoint paths resolve to `/api/...`
- URL builders can derive fully qualified URLs from `VITE_API_BASE_URL`
- when `VITE_API_BASE_URL` is unset, Vite dev proxies `/api` to `VITE_DEV_BACKEND_ORIGIN` or `http://127.0.0.1:8080`
- `mediaAssetApi` performs live fetches and falls back to built-in sample metadata if the backend is unavailable
- playlist and sankalpa persistence now use the backend, while local caches remain in place for fallback and migration

This means:

- the media catalog is now exercised through the real REST boundary
- the current custom-play UX continues working even when the backend is down
- future backend migrations should reuse `apiClient` and the existing boundary modules instead of adding ad hoc `fetch` code inside screens

## Accessing The App From Other Devices On The Same Wi-Fi

### Frontend + backend foundation workflow in this repo

This repository is now enough to run:

- the frontend on another device on the same network
- the backend health endpoint and media catalog on the developer machine

The frontend now uses the live backend media catalog in this workflow, and the main practice, history, playlist, summary, and sankalpa flows can all talk to the local backend.

Start the dev server:

```bash
npm run dev:frontend
```

Start the local production preview:

```bash
npm run preview:app
```

Ports used:

- dev: `5173`
- preview: `4173`

Open on your phone or another device:

- dev: `http://<LAN-IP>:5173/`
- preview: `http://<LAN-IP>:4173/`

Important note:

- `localhost` on your phone means the phone itself, not your development machine
- the preview server is network-accessible, but a connected preview build still needs an explicit `VITE_API_BASE_URL` unless the backend will be served from the same origin as the built app

### How to find the developer machine LAN IP

Common commands:

- macOS Wi-Fi: `ipconfig getifaddr en0`
- macOS alternate interface: `ipconfig getifaddr en1`
- Linux: `hostname -I`
- Windows: `ipconfig`

Use the IPv4 address for the interface connected to your Wi-Fi network.

### Example URLs

If your machine IP is `192.168.1.50`, open:

- `http://192.168.1.50:5173/` for dev
- `http://192.168.1.50:4173/` for preview

### Using the in-repo backend on the same LAN

If you want other devices to reach the backend directly, start it and use the developer machine LAN IP:

```bash
npm run dev:backend
```

Then open:

- `http://<LAN-IP>:8080/api/health`
- `http://<LAN-IP>:8080/api/media/custom-plays`
- `http://<LAN-IP>:8080/media/custom-plays/vipassana-sit-20.mp3`

If you are testing against a separate backend outside this repo instead, use this pattern:

1. Start the backend on the developer machine and make it listen on `0.0.0.0` or the machine LAN IP.
2. Start the front end with a LAN-safe API base URL:

```bash
VITE_API_BASE_URL=http://<LAN-IP>:<BACKEND-PORT>/api npm run dev:frontend
```

3. Open the front end from your phone with:

```text
http://<LAN-IP>:5173/
```

### How the API base URL works

- when `VITE_API_BASE_URL` is unset, API paths default to same-origin `/api`
- in Vite dev, `/api` is proxied to `VITE_DEV_BACKEND_ORIGIN` or `http://127.0.0.1:8080`
- when `VITE_API_BASE_URL` is set, REST boundary helpers build URLs from that configured base
- Vite preview does not proxy `/api`, so a connected preview build must be created with `VITE_API_BASE_URL` unless the backend is deployed on the same origin path
- root-relative static asset paths such as `/media/custom-plays/...` remain same-origin and already work with LAN access

This keeps the default setup clean for local development while avoiding hardcoded `localhost` assumptions for LAN or external backend testing.

### Firewall and OS caveats

If another device cannot reach the app:

- confirm both devices are on the same Wi-Fi network
- confirm the dev machine firewall allows incoming connections for Node.js or the terminal app you used to start Vite
- confirm no VPN or network isolation setting is blocking peer-to-peer LAN traffic
- confirm the port is open on the developer machine:
  - `5173` for dev
  - `4173` for preview

### How to test from another device

For the current checked-in app:

1. Start `npm run dev:frontend`.
2. Open `http://<LAN-IP>:5173/` on the phone.
3. Navigate through the app and create or edit data such as a custom play, playlist, manual log, or sankalpa.
4. Confirm the UI behaves normally on the phone.

Important limitation:

- the app currently stores data in each device's own browser `localStorage`, so phone changes and laptop changes do not sync with each other

### Troubleshooting if the phone loads the UI but API calls fail

For the current checked-in app, the most likely live API failure is the custom-play media catalog call.

Check these first:

- `VITE_API_BASE_URL` must use the developer machine LAN IP, not `localhost`
- the backend must listen on `0.0.0.0` or the LAN IP
- the backend must expose the expected `/api/...` routes
- backend CORS must allow the front-end origin:
  - the default backend config now allows common local/LAN hosts on ports `5173`, `5174`, `4173`, and `4174`
  - if you use different ports or tighter policies, update backend CORS config explicitly
- opening `http://<LAN-IP>:<BACKEND-PORT>/api/...` directly from another device should reach the backend
- browser devtools network errors such as `ERR_CONNECTION_REFUSED` or CORS failures usually point to bind-address or origin-allowlist issues

## Current Persistence Model

### Browser storage

The app currently persists data in `localStorage` using these keys:

- `meditation.timerSettings.v1`
- `meditation.sessionLogs.v1`
- `meditation.customPlays.v1`
- `meditation.playlists.v1`
- `meditation.sankalpas.v1`
- `meditation.activeTimerState.v1`
- `meditation.activePlaylistRunState.v1`

These keys are defined in `src/utils/storage.ts`.

### Start with a clean local state

Because there is no database yet, the clean-start workflow is clearing browser storage.

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
- `backend/src/main/resources/application-dev.yml`

Flyway schema lives in:

- `backend/src/main/resources/db/migration/V1__create_core_reference_and_domain_tables.sql`
- `backend/src/main/resources/db/migration/V2__seed_reference_data.sql`

### How to start with a clean DB

Use:

```bash
npm run db:h2:reset
```

Then restart the backend so Flyway can recreate the schema and seed data.

### Where the schema lives

- `backend/src/main/resources/db/migration/V1__create_core_reference_and_domain_tables.sql`
- `backend/src/main/resources/db/migration/V2__seed_reference_data.sql`

### Where seed or sample data lives

The backend now seeds:

- meditation types
- sample custom-play media metadata

Current reference or sample data also still exists in TypeScript modules:

- meditation types: `src/types/timer.ts`, `src/features/timer/constants.ts`, and `src/data/meditationTypes.json`
- sound options: `src/features/timer/constants.ts` and `src/data/soundOptions.json`
- fallback custom-play media metadata used only when the backend is unavailable: `src/data/customPlayMediaCatalog.json`

### How the app stores media metadata today

There is now a backend DB-backed media metadata model, and the frontend custom-play media flow prefers it.

Current behavior:

- `backend` stores seeded media metadata rows in H2 `media_asset`
- backend migrations store relative media paths such as `custom-plays/vipassana-sit-20.mp3`
- backend API responses expose public media paths such as `/media/custom-plays/vipassana-sit-20.mp3`
- the backend serves `/media/**` from the configured media root
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

Current implemented local model:

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

The backend foundation now includes schema and seeded reference/media data, but the broader domain APIs are still future work.

## Media Files And Storage

### Current state

Important current limitations:

- no audio files are checked into this repo
- timer sound options are labels only
- no code maps timer sounds to actual media files
- no audio playback service exists

The concrete media path convention currently used in code is:

- `src/utils/mediaAssetApi.ts` defines `CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays'`
- backend media metadata responses use that same public path prefix

### Exact directory structure to use for local custom play media

`npm run media:setup` prepares both directory trees below so local verification starts from the right paths.

For backend-backed local development, place files under the backend media root:

```text
local-data/
  media/
    custom-plays/
      vipassana-sit-20.mp3
      ajapa-breath-15.mp3
      tratak-focus-10.mp3
```

For frontend-only static checks during `npm run dev:frontend`, you can also place files under:

```text
public/
  media/
    custom-plays/
      vipassana-sit-20.mp3
      ajapa-breath-15.mp3
      tratak-focus-10.mp3
```

Why there are two useful locations:

- the backend now serves `/media/**` from `local-data/media` by default
- Vite still serves `public/` files from the frontend site root during frontend-only dev
- the repo still does not include real audio files in either location

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

- the backend now serves `/media/**` from the configured media root
- Vite can also serve matching files from `public/` during frontend-only dev
- no runtime code actually fetches or plays the file today

The app still only displays linked media metadata today. It does not yet play the file.

### Does the DB store file paths, relative paths, or URLs

The backend DB stores relative paths.

Current frontend custom play records still store only `mediaAssetId`, and the UI still resolves display details from the sample catalog.

### How to register or link a media file so the app can use it

For the current backend-backed foundation, the registration flow is:

1. Run `npm run media:add:custom-play -- --help` to review the parameters.
2. Register the asset with `npm run media:add:custom-play -- ...`.
3. Restart the backend so Flyway applies the generated migration.
4. Run `npm run dev:frontend` if needed.
5. Open `Practice` -> `Show Tools` -> `Custom Plays`.
6. Select the entry from `Media session (optional)`.
7. Save a custom play.

Current fallback-only shortcut:

1. Use `npm run media:add:custom-play -- ... --skip-frontend-copy` only if you explicitly do not want the public fallback copy.
2. Otherwise let the script mirror the file into `public/media/custom-plays/` for backend-unavailable fallback behavior.

What "use it" means today:

- the media entry appears in the dropdown
- the linked media session appears in the custom play UI
- the custom play persists the media reference by id

What it does not mean yet:

- the app does not play the media file
- the app does not validate the file contents
- the app does not upload or import media

### How media files map to app enumerations or options

There are two separate concepts in the current code:

1. Timer sound options
   - defined in `src/data/soundOptions.json` and exposed through `src/features/timer/constants.ts`
   - values:
     - `None`
     - `Temple Bell`
     - `Soft Chime`
     - `Wood Block`
   - used by timer setup, settings, custom plays, and session logs
   - not currently mapped to file paths

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

### Supported formats

Current catalog entries use:

- file extension: `.mp3`
- MIME type: `audio/mpeg`

No runtime validation enforces this yet, but MP3 is the only format represented in the current implementation.

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

2. Start or restart the app:

```bash
npm run dev:backend
npm run dev:frontend
```

3. In the UI, go to `Practice` -> `Show Tools` -> `Custom Plays`.

4. Create or edit a custom play and choose `Sahaj Evening Sit (25 min)` from `Media session (optional)`.

5. Save the custom play and confirm the UI shows:

- the media session label
- a linked media session reference for the saved custom play

6. Optional backend media-path check:

Open `http://localhost:8080/media/custom-plays/sahaj-evening-25.mp3` on the developer machine, or `http://<LAN-IP>:8080/media/custom-plays/sahaj-evening-25.mp3` from another device, while `npm run dev:backend` is running.

Current limitation:

- this proves the file path is reachable as a static asset if you created `public/`
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

2. Add the label:

```bash
npm run sound:add -- --label "Crystal Bowl"
```

3. Update `defaultTimerSettings` in `src/features/timer/constants.ts` only if you want it to become a default.
4. Run tests.

The UI will then automatically expose the new option in:

- Practice timer setup
- Settings
- Custom Plays

Current limitation:

- this only adds a selectable label
- there is still no file mapping or playback implementation

### Example: add a new sound option in the current repo

Run:

```bash
npm run sound:add -- --label "Crystal Bowl"
```

What happens immediately:

- `Crystal Bowl` appears in the relevant selects
- saved timer settings, session logs, and custom plays can store that string

What does not happen yet:

- there is still no `Crystal Bowl` audio file mapping
- the app will not play it until a sound-playback layer is implemented

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

Current reference data is source-controlled directly in TypeScript:

- meditation types: `src/features/timer/constants.ts` and `src/data/meditationTypes.json`
- sound options: `src/features/timer/constants.ts` and `src/data/soundOptions.json`
- fallback custom-play media catalog: `src/data/customPlayMediaCatalog.json`

### Validate that a new media file is visible and usable

For the current implementation, validate in this order:

1. Ensure the file exists under `local-data/media/custom-plays/` for backend-backed verification.
2. If you also want frontend-only fallback checks without backend media serving, mirror the file under `public/media/custom-plays/`.
3. Ensure the backend media metadata includes the file path you expect.
4. Start the app with `npm run dev:backend` and `npm run dev:frontend`.
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
- backend API startup verification with `npm run dev:backend`
- live frontend startup verification with `npm run dev:frontend`

### Verify media files and configuration

Current manual verification checklist:

1. Run `npm run dev:backend`
2. Run `npm run dev:frontend`
3. Confirm `http://localhost:8080/media/custom-plays/vipassana-sit-20.mp3` is reachable when a matching file exists under the backend media root
4. Open `Practice` -> `Show Tools` -> `Custom Plays`
5. Confirm expected media entries appear in the dropdown
6. Save a custom play and confirm the linked media label is rendered
7. Stop the backend and confirm the UI falls back to built-in sample media with a non-blocking or explicit integration warning, depending on failure type

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
- backend media connectivity also works through the frontend dev proxy:
  - `curl -s http://localhost:5173/api/media/custom-plays`

### Verify front-end / back-end connectivity

You can verify backend reachability in this workspace now, plus the frontend media integration path.

Current verification pattern:

1. Start the backend with `npm run dev:backend`.
2. Open `http://localhost:8080/api/health`.
3. Open `http://localhost:8080/api/media/custom-plays`.
4. Open `http://localhost:8080/media/custom-plays/vipassana-sit-20.mp3` when a matching file exists under the backend media root.
5. Start the front end with `npm run dev:frontend`.
6. Open `http://localhost:5173/api/media/custom-plays` to confirm the dev proxy reaches the backend.
7. In the app, open `Practice` -> `Show Tools` -> `Custom Plays` and confirm media options load with the backend running.
8. Stop the backend and confirm the custom-play media picker falls back to built-in sample options with guidance.

### Verified full-stack local workflow

This prompt verified the following local full-stack flow end to end:

1. Run `npm run media:setup`.
2. Start an isolated backend:

```bash
MEDITATION_H2_DB_NAME=meditation-prompt04 MEDITATION_BACKEND_PORT=8081 npm run dev:backend
```

3. Start the frontend on an already-allowed local dev port and point the proxy at that backend:

```bash
VITE_DEV_BACKEND_ORIGIN=http://127.0.0.1:8081 npm run dev -- --host 127.0.0.1 --port 5174
```

4. Open `http://127.0.0.1:5174/`.
5. Verify the main flows:
   - `Settings` save updates backend-backed timer defaults
   - `History` manual log save appears immediately in recent session log entries
   - `Practice` -> `Show Tools` -> `Custom Plays` creates and applies a `custom play`
   - `Practice` -> `Open Playlists` creates a playlist and records an ended-early playlist `session log`
   - `Sankalpa` saves a goal and `Home` reflects the active sankalpa snapshot plus recent activity

Important distinction:

- Vite dev uses the `/api` proxy
- Vite preview does not proxy `/api`
- if you want a production-build preview connected to a backend, rebuild first with an explicit API base URL, for example:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8081/api npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

## Build And Deployment

### Build production artifacts

```bash
npm run build:app
```

Build output goes to:

```text
dist/
backend/target/
```

### Preview the production build locally

```bash
npm run preview:app
```

The preview server is configured to bind to the local network on port `4173`.

### Deployment assumptions

The repo now produces:

- a static frontend build
- a packaged Spring Boot backend artifact

Important assumptions:

- deploy the contents of `dist/`
- configure SPA history fallback so routes like `/practice` and `/history` return `index.html`
- deploy the backend jar from `backend/target/`
- run Flyway-backed backend startup before considering the API healthy

### Static assets and media in deployment

Current repo behavior:

- if you add files under `public/`, Vite will include them as static assets in the build output
- the custom play media catalog already expects paths under `/media/custom-plays`
- backend media storage expects filesystem content under the configured media root, outside the database

Operational implication:

- if you deploy the backend, place real custom-play media files under the configured backend media root so `/media/**` resolves correctly
- if you are running frontend-only static checks, `public/` assets still work for Vite-served local development

### Runtime configuration required in deployment

Current likely runtime configuration:

- frontend:
  - optional `VITE_API_BASE_URL`
- backend:
  - `MEDITATION_BACKEND_PORT`
  - `MEDITATION_H2_DB_DIR`
  - `MEDITATION_H2_DB_NAME`
  - `MEDITATION_MEDIA_STORAGE_ROOT`

Optional build-time override when pairing the built front end with a separate backend:

- `VITE_API_BASE_URL=http://<HOST>:<PORT>/api`

### Known limitations and TODOs

- timer and playlist sound selections are still UI-only; real playback is not implemented
- optional small gap support between playlist items is not implemented
- custom-play media falls back to built-in sample metadata and is not yet a user-managed library
- sankalpa editing, archival, and delete flows are still unimplemented

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
