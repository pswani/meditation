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
- local-first persistence through browser `localStorage` for current frontend feature flows
- Vite dev `/api` proxy for same-origin frontend/backend local development
- backend-served `/media/**` paths backed by the configured filesystem media root
- H2 + Flyway backing the backend foundation

## Confirmed current gaps
- only the media API boundary uses live HTTP transport today
- no playlist, sankalpa, or custom-play REST domain APIs yet
- no end-to-end frontend/backend feature wiring yet
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
5. playlist and sankalpa backend APIs
6. broader feature-by-feature migration away from local-only persistence

## Current backend module structure
- `backend/src/main/java/com/meditation/backend/config`
- `backend/src/main/java/com/meditation/backend/health`
- `backend/src/main/java/com/meditation/backend/media`
- reserved domain packages for:
  - `customplay`
  - `playlist`
  - `reference`
  - `sankalpa`
  - `sessionlog`

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
- minimal dependencies
- predictable state
- domain-first naming

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
