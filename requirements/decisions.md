# Decisions

## Product and architecture
- Keep the app as a React + TypeScript + Vite SPA backed by one Spring Boot service in `backend/`.
- Keep H2 as the repository's default local and early-production datastore, with Flyway managing schema changes.
- Keep media files on disk under the configured media root and store stable metadata plus relative paths in the database.
- Keep the route and module structure centered on `src/pages`, `src/components`, `src/features`, `src/types`, and `src/utils`.
- Keep the REST boundary explicit through the existing API helper modules instead of coupling route components directly to fetch logic.

## State and runtime behavior
- Keep implemented backend-backed domains local-first with queue-backed replay:
  - timer settings
  - session logs
  - custom plays
  - playlists
  - sankalpas
- Keep persisted timer defaults separate from the Practice screen's in-progress draft state so Home, Settings, and Practice do not overwrite one another unintentionally.
- Persist active timer recovery as one canonical active-session snapshot and preserve paused recovery truthfully instead of reconstructing timer state from looser fragments.
- Keep timer sound selection label-based in saved settings and resolve playback through the shared sound catalog at runtime.
- Keep timer sound hydration backward compatible by remapping retired labels:
  - `Soft Chime` -> `Temple Bell`
  - `Wood Block` -> `Gong`
- Keep shipped timer sounds inline-bundled into the frontend so playback does not depend on a backend `/media/**` route or separate runtime asset fetches.
- Keep timer sound playback Safari-friendly by playing the start cue directly from the user's Start tap and priming only deferred interval/end cues from that same gesture.
- Keep Home's `start last used meditation` shortcut modeled as either:
  - a timer settings snapshot
  - a playlist reference
- Keep Home's `start last used meditation` shortcut able to resume a `custom play` reference when that is the last launched meditation.
- Keep stale playlist-based last-used shortcuts self-healing by clearing them as soon as playlist state proves the target no longer exists.
- Keep runnable `custom play` sessions as a dedicated prerecorded-session runtime:
  - active playback state is persisted separately from timer sessions
  - linked media metadata is required before save and reused for runtime duration
  - auto-created `session log` entries carry `custom play` name and recording context for History and summaries

## Operational workflow
- Keep the repository on one production-first operational path:
  - `./scripts/prod-release.sh` is the golden workflow for build, package, install, and restart
  - the supported frontend runtime shape is same-origin static files behind `nginx`, not a dev or preview server
  - destructive H2 resets are now operator-managed through the configured runtime directory, not a repo helper script
- Keep optional operator-authored prompt bundles under `prompts/` only when explicitly requested, and keep them focused on bounded branch, implement, review, test, fix, and merge sequences.
- Keep media registration script-driven so sound labels, playback mappings, fallback media catalogs, and Flyway migrations stay consistent.
- Keep the production-style deployment model centered on:
  - static frontend files served by `nginx`
  - a loopback-bound Spring Boot backend
  - `launchd` service management on macOS
  - filesystem-backed H2 and media storage

## Current intentional limitations
- Playlist runtime still does not implement optional small gaps between items or true playlist audio playback.
- `sankalpa` editing and archive flows are still unimplemented.
- `TimerContext` remains a dense orchestration boundary and should be split only when that work is directly in scope.

## Documentation and planning
- Keep the durable repo guidance in:
  - `README.md`
  - `AGENTS.md`
  - `PLANS.md`
  - `docs/product-requirements.md`
  - `docs/architecture.md`
  - `docs/ux-spec.md`
  - `docs/screen-inventory.md`
  - `docs/mac-mini-production-runbook.md`
  - `docs/media-registration-scripts.md`
  - `requirements/intent.md`
  - `requirements/roadmap.md`
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`
- Remove prompt-specific review files, old prompt runners, and stale ExecPlans once their durable outcomes have been folded back into the long-lived docs.
- Keep remediation bundle history in Git commits and merge commits rather than rebuilding a second prompt-by-prompt documentation layer after cleanup.
- Treat the next highest-value implementation slice as playlist runtime audio refinement now that the runnable `custom play` flow is in place.
