# Meditation App

Calm, minimal meditation practice app built with React, TypeScript, and Vite.

This README is intentionally grounded in the current repository contents. It explains what exists today, what is only planned, and where the operational gaps still are.

## Current Status

- This workspace is a front-end-only React application.
- There is no checked-in backend service, REST server, Java module, Gradle build, SQL schema, or H2 configuration in this repository.
- The current persistence model is local-first in the browser via `localStorage`.
- Timer, playlist, history, summary, sankalpa, and custom play flows are implemented in the front end.
- Timer sound selections exist in the UI, but actual audio playback is still not implemented.
- Custom play media uses a fixed local sample metadata catalog in code. There is no upload flow, media library service, or H2-backed media table in this repo.

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
- local persistence
- session log generation
- summary derivation
- sankalpa progress calculation
- fixed media metadata lookup for custom plays

The key orchestration layer is `src/features/timer/TimerContext.tsx`, which hydrates local state, persists it, and coordinates timer, playlist, custom play, and session log behavior.

### Back-end responsibilities

No backend code exists in this workspace today.

The repo does contain REST-shaped boundary modules intended for future backend replacement:

- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`

Today those modules do not perform HTTP requests. They read from local storage or from an in-memory catalog and simply expose stable endpoint constants such as:

- `/api/playlists`
- `/api/sankalpas`
- `/api/media/custom-plays`

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

It currently does not make live REST calls.

Important repo facts:

- there is no `fetch` or `axios` integration for playlists, sankalpas, or media in the current codebase
- there is no `VITE_*` API base URL
- there is no Vite proxy in `vite.config.ts`
- there is no backend URL configuration file

Instead, the app uses local API-boundary shims:

| File | Exposed contract | Current implementation |
| --- | --- | --- |
| `src/utils/playlistApi.ts` | `/api/playlists` | reads/writes `localStorage` |
| `src/utils/sankalpaApi.ts` | `/api/sankalpas` | reads/writes `localStorage` |
| `src/utils/mediaAssetApi.ts` | `/api/media/custom-plays` | returns a fixed in-memory media catalog |

This means:

- the front end behaves as if these API contracts exist
- no network traffic is sent for these domains
- swapping in a real backend should start by changing these utility modules instead of rewriting screens

### How H2 is used in this project

H2 is not used in this repository today.

There is currently:

- no H2 JDBC URL
- no `application.yml` or `application.properties`
- no `schema.sql`
- no `data.sql`
- no migration tool
- no `.mv.db` file
- no repository/service/controller code

Any prior references to H2 belong to the broader product vision, not to the runnable code in this workspace.

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
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer recommended
- a modern desktop browser

You do not need Java, Gradle, Docker, H2, or a backend runtime for the current repo.

### Install

```bash
npm ci
```

### Run the front end

```bash
npm run dev
```

The Vite dev server is configured to bind to the local network on port `5173`.

Open:

- on the developer machine: `http://localhost:5173/`
- on other devices on the same Wi-Fi: `http://<LAN-IP>:5173/`

### Run the back end

You cannot run a backend from this repository because none is present.

There is:

- no `gradlew`
- no backend package
- no server entrypoint
- no backend test suite

### Run both together

There is no full-stack "run both" command in this repo.

For the current implementation, "run the app locally" means running the Vite front end only:

```bash
npm run dev
```

If you want to pair this front end with a separate local backend that lives outside this repository:

- run the front end here with `npm run dev`
- run the backend separately on the developer machine
- bind that backend to `0.0.0.0` or the machine LAN IP, not `localhost` only
- point the front end at that backend with `VITE_API_BASE_URL`

### Environment and configuration variables

There are no required environment variables for the current local-first app.

An optional example file is included:

- `.env.example`

Optional variable:

- `VITE_API_BASE_URL`
  - default behavior when unset: same-origin `/api`
  - use this only when you are pairing the front end with a separate backend host or port
  - example LAN override: `VITE_API_BASE_URL=http://192.168.1.50:8080/api`

Code audit results:

- no `.env` file is present
- no `process.env` frontend config exists
- no backend host/port config exists

Current operational meaning:

- install dependencies
- start Vite
- use browser local storage for persistence
- optionally override the future/live API base with `VITE_API_BASE_URL`

### Default ports and URLs

Current repo defaults:

- front end dev server: `http://localhost:5173/` on the developer machine, `http://<LAN-IP>:5173/` from other devices
- front end preview server: `http://localhost:4173/` on the developer machine, `http://<LAN-IP>:4173/` from other devices
- backend API base URL when unset: same-origin `/api`
- H2 console URL: not applicable

### How the front end is configured to call backend APIs

It is still not configured to perform live HTTP requests today.

The repo now contains one shared API-base helper in `src/utils/apiConfig.ts` plus REST-style boundary modules:

- `src/utils/apiConfig.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`

Current behavior:

- stable same-origin endpoint paths still resolve to `/api/...`
- URL builders can also derive fully qualified LAN-safe URLs from `VITE_API_BASE_URL`
- persistence remains local-first in browser storage
- no network traffic is sent by the current implementation

Because there is no HTTP client yet, changing `VITE_API_BASE_URL` alone will not connect the app to a live server. A future backend integration would also need:

- real HTTP request code
- error handling
- either a build-time base URL or a Vite dev proxy

## Accessing The App From Other Devices On The Same Wi-Fi

### Front-end only workflow in this repo

This repository is currently enough to test the UI from a phone, tablet, or another computer on the same network.

Start the dev server:

```bash
npm run dev
```

Start the local production preview:

```bash
npm run build
npm run preview
```

Ports used:

- dev: `5173`
- preview: `4173`

Open on your phone or another device:

- dev: `http://<LAN-IP>:5173/`
- preview: `http://<LAN-IP>:4173/`

Important note:

- `localhost` on your phone means the phone itself, not your development machine

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

### Using a separate backend on the same LAN

No backend server exists in this repository, so there is nothing extra to run here.

If you are testing against a separate backend outside this repo, use this pattern:

1. Start the backend on the developer machine and make it listen on `0.0.0.0` or the machine LAN IP.
2. Start the front end with a LAN-safe API base URL:

```bash
VITE_API_BASE_URL=http://<LAN-IP>:<BACKEND-PORT>/api npm run dev
```

3. Open the front end from your phone with:

```text
http://<LAN-IP>:5173/
```

### How the API base URL works

- when `VITE_API_BASE_URL` is unset, API paths default to same-origin `/api`
- when `VITE_API_BASE_URL` is set, REST boundary helpers build URLs from that configured base
- root-relative static asset paths such as `/media/custom-plays/...` remain same-origin and already work with LAN access

This keeps the default setup clean for local-first use while avoiding hardcoded `localhost` assumptions for future live backend testing.

### Firewall and OS caveats

If another device cannot reach the app:

- confirm both devices are on the same Wi-Fi network
- confirm the dev machine firewall allows incoming connections for Node.js or the terminal app you used to start Vite
- confirm no VPN or network isolation setting is blocking peer-to-peer LAN traffic
- confirm the port is open on the developer machine:
  - `5173` for dev
  - `4173` for preview

### How to test from another device

For the current front-end-only repo:

1. Start `npm run dev`.
2. Open `http://<LAN-IP>:5173/` on the phone.
3. Navigate through the app and create or edit data such as a custom play, playlist, manual log, or sankalpa.
4. Confirm the UI behaves normally on the phone.

Important limitation:

- the app currently stores data in each device's own browser `localStorage`, so phone changes and laptop changes do not sync with each other

### Troubleshooting if the phone loads the UI but API calls fail

For the current checked-in app, this should not happen because there are no live API calls yet.

If you later pair the front end with a real backend, check these first:

- `VITE_API_BASE_URL` must use the developer machine LAN IP, not `localhost`
- the backend must listen on `0.0.0.0` or the LAN IP
- the backend must expose the expected `/api/...` routes
- backend CORS must allow the front-end origin, for example:
  - `http://<LAN-IP>:5173`
  - `http://<LAN-IP>:4173`
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

Nowhere in this repo.

There is no H2 configuration to document because the backend is not present.

### How to start with a clean DB

Not applicable in this repo.

Use the local-storage reset flow above instead.

### Where the schema lives

No schema files exist in this repository.

### Where seed or sample data lives

There is no database seed layer.

Current reference or sample data is hard-coded in TypeScript modules:

- meditation types: `src/types/timer.ts` and `src/features/timer/constants.ts`
- sound options: `src/features/timer/constants.ts`
- fixed custom play media metadata catalog: `src/utils/mediaAssetApi.ts`

### How the app stores media metadata today

There is no DB-backed media model.

Current behavior:

- `src/utils/mediaAssetApi.ts` contains a fixed catalog of `MediaAssetMetadata`
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

The catalog remains the source of truth for linked media details shown in the UI. There is no H2 row or backend media lookup.

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

That backend model is not implemented here, so treat it as design intent, not an operational artifact.

## Media Files And Storage

### Current state

Important current limitation:

- no audio files are checked into this repo
- there is no `public/` directory yet
- timer sound options are labels only
- no code maps timer sounds to actual media files
- no audio playback service exists

The only concrete media path convention that exists in code today is for custom play media metadata:

- `src/utils/mediaAssetApi.ts` defines `CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays'`

### Exact directory structure to use for local custom play media

If you want the file paths in the existing media catalog to point at real static files during local development, create this directory structure:

```text
public/
  media/
    custom-plays/
      vipassana-sit-20.mp3
      ajapa-breath-15.mp3
      tratak-focus-10.mp3
```

Why this path:

- the current catalog already references paths like `/media/custom-plays/vipassana-sit-20.mp3`
- with Vite, files placed under `public/` are served from the site root
- that means `public/media/custom-plays/vipassana-sit-20.mp3` is available at `/media/custom-plays/vipassana-sit-20.mp3`

This is the intended local file placement compatible with the current codebase. The repo simply does not contain those files yet.

### How media file paths are referenced in H2

They are not referenced in H2 because H2 is not present.

### How media file paths are referenced today

Custom play media paths are referenced in one place today:

1. In the fixed metadata catalog in `src/utils/mediaAssetApi.ts`

Example stored value:

```text
/media/custom-plays/vipassana-sit-20.mp3
```

That is a root-relative URL path, not an absolute filesystem path.

### Are media files served statically or via backend endpoints

Current answer:

- custom play media paths are modeled as static paths
- no backend media-serving endpoint exists
- no runtime code actually fetches or plays the file today

If you add files under `public/media/custom-plays`, Vite can serve them statically, but the current app will only display the metadata path. It will not play the file yet.

### Does the DB store file paths, relative paths, or URLs

There is no DB.

Current custom play records store only `mediaAssetId`. The root-relative path stays in the sample media catalog.

### How to register or link a media file so the app can use it

For custom play metadata, the registration flow is:

1. Put the file under `public/media/custom-plays/` using a stable filename.
2. Add a catalog entry to `src/utils/mediaAssetApi.ts`.
3. Run `npm run dev`.
4. Open `Practice` -> `Show Tools` -> `Custom Plays`.
5. Select the new entry from `Media session (optional)`.
6. Save a custom play.

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
   - defined in `src/features/timer/constants.ts`
   - values:
     - `None`
     - `Temple Bell`
     - `Soft Chime`
     - `Wood Block`
   - used by timer setup, settings, custom plays, and session logs
   - not currently mapped to file paths

2. Custom play media sessions
   - defined by metadata entries in `src/utils/mediaAssetApi.ts`
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

1. Create the file:

```text
public/media/custom-plays/sahaj-evening-25.mp3
```

2. Add it to `src/utils/mediaAssetApi.ts`:

```ts
{
  id: 'media-sahaj-evening-25',
  label: 'Sahaj Evening Sit (25 min)',
  filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/sahaj-evening-25.mp3`,
  durationSeconds: 1500,
  mimeType: 'audio/mpeg',
  sizeBytes: 11_000_000,
  updatedAt: '2026-03-25T08:00:00.000Z',
}
```

3. Start the app:

```bash
npm run dev
```

4. In the UI, go to `Practice` -> `Show Tools` -> `Custom Plays`.

5. Create or edit a custom play and choose `Sahaj Evening Sit (25 min)` from `Media session (optional)`.

6. Save the custom play and confirm the UI shows:

- the media session label
- a linked media session reference for the saved custom play

7. Optional static-file check:

Open `http://localhost:5173/media/custom-plays/sahaj-evening-25.mp3` on the developer machine, or `http://<LAN-IP>:5173/media/custom-plays/sahaj-evening-25.mp3` from another device, while `npm run dev` is running.

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

Current front-end steps:

1. Add the label to `soundOptions` in `src/features/timer/constants.ts`
2. Update `defaultTimerSettings` if you want it to become a default
3. Update any custom play defaults if needed
4. Run tests

The UI will then automatically expose the new option in:

- Practice timer setup
- Settings
- Custom Plays

Current limitation:

- this only adds a selectable label
- there is still no file mapping or playback implementation

### Example: add a new sound option in the current repo

Change `src/features/timer/constants.ts`:

```ts
export const soundOptions: readonly string[] = [
  'None',
  'Temple Bell',
  'Soft Chime',
  'Wood Block',
  'Crystal Bowl',
];
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
- you cannot finish backend or H2 wiring here because those layers do not exist in this workspace

Front-end checklist for enum-backed additions:

1. Update the shared type in `src/types`
2. Update any UI option list in `src/features/.../constants.ts`
3. Update persistence normalization and validation in `src/utils/storage.ts`
4. Update any helper logic in `src/utils`
5. Add or update focused tests

Backend/H2 work that would still be required outside this repo:

- database enum or lookup table
- schema migration
- REST contract update
- server-side validation
- seed or reference-data updates

### Update seed or reference data

There is no DB seed layer.

Current reference data is source-controlled directly in TypeScript:

- meditation types: `src/features/timer/constants.ts`
- sound options: `src/features/timer/constants.ts`
- custom play media catalog: `src/utils/mediaAssetApi.ts`

### Validate that a new media file is visible and usable

For the current implementation, validate in this order:

1. Ensure the file exists under `public/media/custom-plays/`
2. Ensure there is a matching entry in `src/utils/mediaAssetApi.ts`
3. Start the app with `npm run dev`
4. Confirm the item appears in the `Media session (optional)` dropdown
5. Save a custom play using it
6. Confirm the saved custom play shows the media session label
7. Optionally open the direct static URL in the browser

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
- live local startup verification with `npm run dev`

### Verify media files and configuration

Current manual verification checklist:

1. Run `npm run dev`
2. Open `Practice` -> `Show Tools` -> `Custom Plays`
3. Confirm expected media entries appear in the dropdown
4. Save a custom play and confirm the label and managed path are rendered
5. If you created actual files under `public/media/custom-plays`, open the direct file URL in the browser

### Verify REST APIs are reachable

Not applicable for this repo as-is because no backend server is present and the front end does not perform HTTP requests for these domains.

What you can verify today instead:

- API base-path and URL-building behavior remain stable in:
  - `src/utils/apiConfig.test.ts`
- endpoint contract strings remain stable in:
  - `src/utils/playlistApi.test.ts`
  - `src/utils/sankalpaApi.test.ts`
  - `src/utils/mediaAssetApi.test.ts`

### Verify front-end / back-end connectivity

You cannot verify live front-end / back-end connectivity in this workspace alone because there is no backend here and no frontend HTTP integration yet.

If you pair the front end with a separate backend outside this repo, verify connectivity like this:

1. Start the backend bound to `0.0.0.0`.
2. Start the front end with `VITE_API_BASE_URL=http://<LAN-IP>:<BACKEND-PORT>/api npm run dev`.
3. Open `http://<LAN-IP>:5173/` from another device.
4. Confirm the backend is reachable directly at `http://<LAN-IP>:<BACKEND-PORT>/api/...`.
5. Trigger the relevant UI flow and check backend logs plus browser network requests.

## Build And Deployment

### Build production artifacts

```bash
npm run build
```

Build output goes to:

```text
dist/
```

### Preview the production build locally

```bash
npm run preview
```

The preview server is configured to bind to the local network on port `4173`.

### Deployment assumptions

Current deployment target is a static front-end host for the built Vite app.

Important assumptions:

- deploy the contents of `dist/`
- configure SPA history fallback so routes like `/practice` and `/history` return `index.html`
- there is no server-side API artifact to deploy from this repository
- there is no database migration step from this repository

### Static assets and media in deployment

Current repo behavior:

- there is no checked-in `public/` directory yet
- if you add files under `public/`, Vite will include them as static assets in the build output
- the custom play media catalog already expects paths under `/media/custom-plays`

Operational implication:

- if you choose to add real custom play media files before a backend exists, deploy them as static assets under the same public path structure the catalog expects

### Runtime configuration required in deployment

None for the current front-end-only app.

There is currently:

- no runtime env injection
- no required API base URL
- no backend hostname config

Optional build-time override when pairing the built front end with a separate backend:

- `VITE_API_BASE_URL=http://<HOST>:<PORT>/api`

### Known limitations and TODOs

- timer and playlist sound selections are still UI-only; real playback is not implemented
- optional small gap support between playlist items is not implemented
- custom play media is a fixed source-code catalog, not a user-managed library
- there is no backend service in this workspace
- there is no H2 persistence layer in this workspace
- there is no live REST integration to verify or deploy

## Operator Notes

For someone trying to configure, run, or deploy this project today, the correct mental model is:

- this repo is operational as a front-end prototype
- it is not yet operational as a full-stack deployment unit
- local persistence is the source of truth
- REST and H2 sections in the design materials describe intended seams, not runnable infrastructure here

## Verification Snapshot

The repo’s required quality commands are:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Use those commands before handing off documentation or behavior changes.
