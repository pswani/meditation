# Current State

This file now tracks the durable current repository state rather than a prompt-by-prompt execution history.

## Repository status
- Current branch: `codex/playlist-runtime-audio-feature-bundle-with-branching`
- Active bundle: `playlist-runtime-audio-feature-bundle-with-branching`
- Parent branch for the active bundle: `codex/feature-refinement`
- Active feature branch for the bundle: `codex/playlist-runtime-audio-feature-bundle-with-branching`
- Active bundle scope: implement playlist runtime audio playback, optional small gaps, trustworthy playlist logging, and supporting review/verification work
- Latest completed bundle: `custom-play-runtime-feature-bundle-with-branching`
- Latest merge outcome: merged `codex/custom-play-runtime-feature-bundle-with-branching` back into `codex/feature-refinement` on 2026-04-02 with history preserved by a normal local merge commit
- The app is a working full-stack meditation application with:
  - a React + TypeScript + Vite frontend
  - a Spring Boot backend in `backend/`
  - H2 persistence plus Flyway migrations
  - local-first offline-capable behavior for the implemented backend-backed domains
- The recent intent-remediation work closed two high-value trust gaps:
  - managed local startup is now more reliable and explicit about local recovery
  - Home can restart the last used meditation through a persisted timer or playlist launch context
- Timer sound packaging now ships `Temple Bell` and `Gong` as bundled frontend/backend MP3 assets while retiring `Soft Chime` and `Wood Block` from the selectable catalog.
- Timer playback now resolves shipped sounds from inline frontend-bundled assets instead of requiring the backend media route, which avoids 404s when the UI is paired with an unmanaged backend and removes separate sound-file fetches.
- Timer playback now starts the selected start cue directly from the Start action and primes only deferred interval/end cues from that same user gesture, which is intended to keep iPhone Safari playback working after reloads or fresh tab opens.
- Frontend hydration now remaps legacy saved sound labels so existing timer settings, custom plays, active sessions, and cached timer-oriented state continue to load cleanly after the catalog change.
- The repo now uses a production-only operational workflow:
  - removed dev, preview, and managed local-stack scripts plus the Spring `dev` profile
  - added `./scripts/prod-build.sh` and `./scripts/prod-release.sh`
  - centered package scripts and docs on one golden path: build/package/install/restart through the production Mac flow
- Prompt bundles for the next three major product slices now live under `prompts/`, along with a reusable parameterized runner prompt:
  - `custom-play-runtime-feature-bundle-with-branching`
  - `playlist-runtime-audio-feature-bundle-with-branching`
  - `sankalpa-edit-archive-feature-bundle-with-branching`
  - `run-milestone-bundle.md`
- The `custom play` runtime slice is now implemented on this feature branch:
  - Practice and Home can start a true runnable prerecorded `custom play`
  - active `custom play` state persists across route changes and reloads
  - the shell keeps media playback aligned with runtime state through a hidden audio element
  - completion and early end both create trustworthy `session log` entries with `custom play` metadata
  - playlist and timer starts are blocked while a `custom play` run is active
- The playlist runtime audio slice is now implemented on this feature branch:
  - playlists can define an optional small gap between items
  - playlist items can stay timed-only or link to saved `custom play` recordings for true runtime playback
  - active playlist runs persist the current item or gap phase across route changes and reloads
  - playlist completion and early-stop behavior now create trustworthy per-item `session log` entries
  - playlist launch fails safely when a linked recording can no longer be resolved
- Review and verification artifacts for this slice now live in:
  - `docs/review-custom-play-runtime-feature.md`
  - `docs/test-custom-play-runtime-feature.md`
- Playlist runtime audio review findings now live in:
  - `docs/review-playlist-runtime-audio-feature.md`
- Playlist runtime audio verification artifacts now live in:
  - `docs/execplan-playlist-runtime-audio-test.md`
  - `docs/test-playlist-runtime-audio-feature.md`
- The repository documentation surface has been cleaned up to keep durable product, architecture, operations, and current-state guidance while removing stale prompt-tracking artifacts.
- Bundle completion summary:
  - restored the documented managed local startup flow and safer H2 recovery guidance
  - added Home `start last used meditation`
  - removed stale prompt, review, handoff-history, and ExecPlan artifacts after folding durable outcomes into the long-lived docs
- Cleanup verification completed on 2026-04-01:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- Custom play runtime verification completed on 2026-04-02:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- Playlist runtime audio implementation verification completed on 2026-04-02:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- Playlist runtime audio verification scenarios now cover:
  - linked-recording playlist item resolution and launch failure when a linked recording is unavailable
  - optional small-gap sequencing and remaining-time math
  - playlist early-end logging and History continuity
  - timed playlist persistence write-throttling regression coverage
- Bundle completion summary:
  - added a dedicated runnable prerecorded `custom play` flow with persisted playback state and a dedicated active runtime screen
  - connected Home and Practice shortcuts to start or resume `custom play` runs directly
  - extended `session log` storage, API contracts, and History/Home rendering with `custom play` metadata
  - fixed the final backend verification issues by narrowing the new Flyway migration and updating API tests to use a valid `custom play` fixture

## Verification baseline
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` when backend-facing operational or setup guidance changes

## Remaining known gaps
- Finish verifying the new production-only scripts and docs end to end after the dev/preview removal.
- Add `sankalpa` edit and archive flows.
- Reduce `TimerContext` size only when doing directly related feature or maintenance work.
- Review finding: recording-backed playlist run recovery currently trusts stale `endAtMs` wall-clock state instead of the persisted playback position after reload.
- Review finding: backend playlist saves still accept dangling `customPlayId` references, so broken linked items can persist until runtime launch.
- Browser-level media playback behavior for linked playlist recordings is still unverified in automation; current confidence comes from unit/UI tests plus runtime copy paths.
- Fix the important review findings before merging the feature branch back into `codex/feature-refinement`.

## Recommended next slice
- Exact recommended next prompt: `prompts/playlist-runtime-audio-feature-bundle-with-branching/04-fix-playlist-runtime-audio-findings.md`
