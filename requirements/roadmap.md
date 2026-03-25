# Roadmap

## V1
- app shell
- responsive navigation
- timer setup and active session
- meditation types
- custom plays
- playlists
- automatic session logging
- manual session logging
- summaries
- sankalpa goals
- favorites
- local persistence

## Current implementation status
- The current repository implements the V1 core flows in a front-end-only, local-first form:
  - Home
  - Practice timer
  - custom plays
  - playlists and playlist runs
  - automatic and manual session logging
  - summaries
  - sankalpa goals
  - settings/default persistence

## Remaining release-candidate gaps
- add optional small gap support between playlist items
- expand summaries to include:
  - by source
  - by date range
  - by time-of-day bucket
- decide whether a backend/service handoff is needed beyond the current local-first scope
