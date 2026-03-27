# Architecture

## Front-end architecture
Single-page React application with route-based screens and feature-oriented modules.

## Current runtime architecture
- React SPA served by Vite
- Spring Boot backend foundation under `backend/`
- default backend runtime with developer-only surfaces disabled
- `dev` backend profile for local-only conveniences such as the H2 console
- shared frontend API client and API-base helpers under `src/utils`
- route-level screens in `src/pages`
- feature logic in `src/features`
- shared domain types in `src/types`
- storage, validation, summary, and API-boundary helpers in `src/utils`
- backend-backed persistence for custom plays, playlists, sankalpas, timer settings, and session logs
- browser `localStorage` fallback caches and migration support for backend-backed flows, including sankalpas
- browser-persisted sync queue state for offline-first deferred writes
- Vite dev `/api` proxy for same-origin frontend/backend local development
- backend-served `/media/**` paths backed by the configured filesystem media root
- H2 + Flyway backing the backend foundation

## Confirmed current gaps
- full-stack wiring is now in place for:
  - custom plays
  - playlists
  - sankalpas
  - summaries
  - timer settings
  - session logs
- sankalpa editing/archive flows are still not implemented
- no media upload/import workflow yet
- timer and playlist audio playback are still unimplemented

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
- current session-log REST surfaces include:
  - `/api/session-logs`
  - `/api/session-logs/manual`
- current summary REST surfaces include:
  - `/api/summaries`
    - accepts optional `timeZone` query input for time-of-day aggregation
- reserved domain packages for:
  - `reference`

## Media storage conventions
- backend media root is configurable through `MEDITATION_MEDIA_STORAGE_ROOT`
- current default media root resolves to `local-data/media`
- custom-play media lives under the `custom-plays/` subdirectory
- H2 stores relative paths such as `custom-plays/vipassana-sit-20.mp3`
- API responses expose a web-facing path such as `/media/custom-plays/vipassana-sit-20.mp3`
- backend resource handling serves `/media/**` from the configured media root

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
- `src/utils/syncQueue.ts` owns queue persistence and queue-reduction helpers.
- Queue entries are stored in browser storage so deferred writes survive reloads.
- The shell surfaces offline and pending-sync state as lightweight status banners instead of blocking overlays or dashboard-style widgets.

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

## Responsive shell guidance
- mobile: bottom navigation
- tablet and desktop: top or side navigation may be appropriate
- shared route structure should remain consistent across devices
