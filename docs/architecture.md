# Architecture

## Front-end architecture
Single-page React application with route-based screens and feature-oriented modules.

## Current runtime architecture
- React SPA served by Vite
- route-level screens in `src/pages`
- feature logic in `src/features`
- shared domain types in `src/types`
- storage, validation, summary, and API-boundary helpers in `src/utils`
- local-first persistence through browser `localStorage`

## Confirmed current gaps
- no backend module or Java runtime code
- no Spring Boot application entrypoint
- no H2 datasource configuration
- no schema or migration files
- no checked-in REST controller/service/repository layer
- no live HTTP transport in the front-end API-boundary utilities
- no database-backed media metadata or filesystem media-management workflow

## Chosen full-stack target architecture
- keep the current React front end and route model
- add one Spring Boot backend application as the primary server
- use H2 as the first persistent datastore
- store media files under a configured filesystem root, outside the database
- store media metadata and relative media paths in database tables
- migrate front-end API boundaries from local shims to real REST calls incrementally

## Planned backend responsibilities
- expose REST endpoints for:
  - playlists
  - sankalpas
  - custom-play media assets
- own H2 persistence and schema evolution
- validate and normalize stored records before returning them to the front end
- manage the configured media root and DB-referenced media metadata

## Planned implementation order
1. add Spring Boot backend foundation and H2 configuration
2. add schema/migration support and core persistence entities
3. add media metadata + filesystem management
4. swap front-end API shims to real REST integration one domain at a time
5. tighten end-to-end local run/build workflows once both runtimes exist

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
