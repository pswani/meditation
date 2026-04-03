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
- Mitigate iPhone Safari lock-screen completion-bell deferral with a web-first path:
  - force timer catch-up evaluation on `visibilitychange`/`pageshow` foreground return
  - coalesce overlapping foreground events so one foreground return produces one catch-up pass
  - show calm Safari-specific guidance only in likely iPhone Safari browser contexts
  - preserve deferred-completion metadata on fixed timer outcomes so the completion UI can explain foreground catch-up
  - attempt completion notifications only when browser permission is granted and the document is hidden
- Keep timer completion notification UX explicit in Settings:
  - derive capability and permission state from the current browser runtime
  - expose a user-controlled permission request action only when the browser can actually prompt
  - keep iPhone Safari copy explicit that browser-tab lock-screen behavior can still defer completion handling
- Keep Home's `start last used meditation` shortcut modeled as either:
  - a timer settings snapshot
  - a playlist reference
- Keep Home's `start last used meditation` shortcut able to resume a `custom play` reference when that is the last launched meditation.
- Keep stale playlist-based last-used shortcuts self-healing by clearing them as soon as playlist state proves the target no longer exists.
- Keep runnable `custom play` sessions as a dedicated prerecorded-session runtime:
  - active playback state is persisted separately from timer sessions
  - linked media metadata is required before save and reused for runtime duration
  - auto-created `session log` entries carry `custom play` name and recording context for History and summaries
- Keep playlist runs modeled as a runtime snapshot instead of reading mutable playlist records live during playback:
  - each run stores resolved item titles, durations, and any linked `custom play` media metadata at launch time
  - optional small gaps are stored at the playlist level and replayed as explicit runtime segments
  - recording-backed recovery resumes from the persisted playback position instead of advancing from stale wall-clock timing after reload
  - linked-recording items fail fast before launch if their referenced `custom play` or media asset can no longer be resolved
  - playlist item completion and early-end logging stays per item rather than inventing a second aggregate-only history model
- Keep backend playlist saves referentially safe for linked recordings by rejecting a `customPlayId` that does not currently resolve to a saved `custom play`.
- Keep `sankalpa` edits id-stable:
  - preserve `id` and `createdAt` when editing goal fields so progress and deadline windows stay anchored to the original goal
  - recalculate progress from the updated goal fields without inventing a second versioned goal history model
- Keep `sankalpa` archival as a first-class persisted goal state:
  - frontend, local cache, and backend contracts all carry the same `archived` flag
  - archived goals stay visible in a dedicated read-only section instead of being deleted from the product surface
- Keep `sankalpa` restore and delete behavior explicit and trust-preserving:
  - archived goals can be restored by clearing the persisted `archived` flag and reusing the existing derived `active` / `completed` / `expired` status rules
  - permanent delete is restricted to already archived goals so destructive actions stay deliberate
  - queue-backed `sankalpa` deletes use the same stale-mutation protection as other backend-backed collections and restore the current backend state when an older queued delete loses reconciliation

## Operational workflow
- Keep the repository on one production-first operational path:
  - `./scripts/prod-release.sh` is the golden workflow for build, package, install, and restart
  - the supported frontend runtime shape is same-origin static files behind `nginx`, not a dev or preview server
  - destructive H2 resets are now operator-managed through the configured runtime directory, not a repo helper script
- Keep optional operator-authored prompt bundles under `prompts/` only when explicitly requested, and keep them focused on bounded branch, implement, review, test, fix, and merge sequences.
- Keep media registration script-driven so sound labels, playback mappings, fallback media catalogs, and Flyway migrations stay consistent.
- Keep iPhone Safari browser-tab timer release confidence grounded in a reusable manual checklist until the product has a stronger platform-level completion guarantee than browser-tab background execution can provide.
- Keep the production-style deployment model centered on:
  - static frontend files served by `nginx`
  - a loopback-bound Spring Boot backend
  - `launchd` service management on macOS
  - filesystem-backed H2 and media storage

## Current intentional limitations
- Custom-play recordings now use a managed backend-backed media library with frontend fallback metadata, but registration is still script-driven and there is still no browser upload/import workflow.
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
- Author the next bounded prompt bundle before running the milestone runner again; the current bundled slices are now complete.
