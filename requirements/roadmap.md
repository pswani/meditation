# Roadmap

## Release candidate status
- Milestone D production-readiness prompt set is complete.
- The current repository is in a clean front-end handoff state with setup, typecheck, lint, test, and build workflows verified.
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
- implement actual audio playback for selected timer and playlist sounds
- add optional small gaps between playlist items
- replace the fixed custom-play media catalog with a fuller user-managed or backend-backed media source when that work is in scope

## Handoff notes
- This workspace remains intentionally front-end only.
- Local-first persistence is still the current v1 baseline, with API-style utilities in selected areas for future backend compatibility.
