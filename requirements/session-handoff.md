# Current State

This file now tracks the durable current repository state rather than a prompt-by-prompt execution history.

## Repository status
- Current branch: `codex/review-and-cleanup`
- Latest completed bundle: `codex/intent-remediation-bundle`
- Merge outcome: merged back into `codex/review-and-cleanup` on 2026-04-01 with history preserved by a normal local merge commit
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
- Frontend hydration now remaps legacy saved sound labels so existing timer settings, custom plays, active sessions, and cached timer-oriented state continue to load cleanly after the catalog change.
- The repo now uses a production-only operational workflow:
  - removed dev, preview, and managed local-stack scripts plus the Spring `dev` profile
  - added `./scripts/prod-build.sh` and `./scripts/prod-release.sh`
  - centered package scripts and docs on one golden path: build/package/install/restart through the production Mac flow
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

## Verification baseline
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` when backend-facing operational or setup guidance changes

## Remaining known gaps
- Finish verifying the new production-only scripts and docs end to end after the dev/preview removal.
- Implement a true runnable `custom play` prerecorded-session flow instead of treating it only as timer metadata plus linked media.
- Add optional small gaps between playlist items and complete playlist runtime audio behavior.
- Add `sankalpa` edit and archive flows.
- Reduce `TimerContext` size only when doing directly related feature or maintenance work.

## Recommended next slice
- First, complete end-to-end verification of the production-only release path on the target Mac host:
  - run `./scripts/prod-release.sh`
  - confirm nginx same-origin API behavior, timer sounds, and session-log persistence after reinstall
- After that, implement the missing runnable `custom play` flow as one bounded vertical slice:
  - keep scope focused on custom-play runtime behavior, logging, validation, and related UX
  - exclude playlist runtime expansion, broader media-library management, and unrelated refactors
