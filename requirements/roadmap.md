# Roadmap

## Release candidate status
- Milestone D production-readiness prompt set is complete.
- The current repository is in a working full-stack state with setup, typecheck, lint, test, and build workflows verified.
- The app now covers the full intended primary surface area:
  - Home
  - Practice
  - History
  - Sankalpa
  - Settings

## V1 baseline implemented
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

## Remaining v1 release-candidate gaps
- implement actual audio playback for playlist runtime audio
- add optional small gaps between playlist items
- replace the fixed custom-play media catalog with a fuller user-managed or backend-backed media source when that work is in scope

## Current implementation notes
- This workspace now includes the Spring Boot backend, H2 persistence, and live frontend REST integration described in `README.md` and `docs/architecture.md`.
- Local-first persistence and offline queue behavior remain part of the current v1 baseline, while implemented backend-backed flows already use the real REST boundaries in this repo.
