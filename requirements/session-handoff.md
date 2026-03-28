# Session Handoff

## Current status
Production deployment guidance is now explicit. The repo now has script-first packaging and backend runtime helpers for a production-oriented deployment shape where nginx serves the frontend build and reverse-proxies the Spring Boot backend.

## 2026-03-28 production deployment scripting
- Added and updated:
  - `requirements/execplan-production-deployment-scripting.md`
  - `README.md`
  - `docs/architecture.md`
  - `.env.example`
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`
  - `scripts/common.sh`
  - `scripts/render-nginx-config.sh`
  - `scripts/package-deploy.sh`
  - `scripts/prod-backend-start.sh`
  - `scripts/prod-backend-stop.sh`
  - `scripts/prod-backend-restart.sh`
  - `scripts/prod-backend-status.sh`
  - `scripts/prod-backend-logs.sh`
- Deployment workflow changes:
  - production frontend deployment is now documented as a static build served by nginx, not by Vite dev or preview
  - `./scripts/package-deploy.sh` now builds and assembles:
    - frontend static files
    - backend jar
    - nginx site config
    - backend env example
  - `./scripts/render-nginx-config.sh` now renders an nginx site config that serves the frontend bundle and proxies `/api` plus `/media` to the backend
  - `./scripts/prod-backend-start.sh`, `stop`, `restart`, `status`, and `logs` now manage the packaged backend jar in a production-oriented runtime directory
- Important implementation notes:
  - nginx remains operator-managed; the repo scripts manage the backend jar and generate nginx config, but do not install or restart nginx
  - the prod backend scripts default to loopback binding through `MEDITATION_BACKEND_BIND_HOST=127.0.0.1`
  - the prod backend scripts use the packaged jar under `local-data/deploy/backend/meditation-backend.jar` when present, otherwise they fall back to the latest built jar in `backend/target/`
- Verification completed:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `./scripts/render-nginx-config.sh`
  - passed `./scripts/package-deploy.sh --skip-build`
  - passed `./scripts/prod-backend-start.sh` in a persistent shell session
  - passed `./scripts/prod-backend-status.sh` in a persistent shell session
  - passed `curl -s http://127.0.0.1:8080/api/health` in a persistent shell session
  - passed `./scripts/prod-backend-stop.sh` in a persistent shell session
- Exact recommended next prompt:
  - `Implement a bounded deployment-hardening slice for the meditation app. Add an operator-safe production env template, tighten the generated nginx config with optional HTTPS and cache-control knobs, add focused shell-script smoke checks for the production packaging and backend lifecycle helpers, update README plus architecture/decisions/session-handoff, run typecheck/lint/test/build and the new script checks, and commit with a clear message. Exclude containerization, CI/CD, and cloud-specific infrastructure.`

## Current status prior to this slice
Real timer sound playback is now implemented for the timer flow. The app now plays mapped local sound files for session start, interval cues, natural completion, and early stop, and the `sound:add` workflow can register playable timer sound mappings in addition to selectable labels.

## 2026-03-27 real timer sound playback
- Added and updated:
  - `requirements/execplan-timer-sound-playback.md`
  - `README.md`
  - `docs/architecture.md`
  - `docs/media-registration-scripts.md`
  - `requirements/roadmap.md`
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`
  - `scripts/add-sound-option.mjs`
  - `scripts/common.sh`
  - `scripts/media-registration-utils.mjs`
  - `scripts/setup-media-root.sh`
  - `src/data/timerSoundCatalog.json`
  - `src/features/timer/TimerContext.tsx`
  - `src/features/timer/timerContextObject.ts`
  - `src/features/timer/timerSoundCatalog.ts`
  - `src/features/timer/timerSoundPlayback.ts`
  - `src/features/timer/timerSoundCatalog.test.ts`
  - `src/features/timer/timerSoundPlayback.test.tsx`
  - `src/pages/ActiveTimerPage.tsx`
  - `src/test/setup.ts`
  - tracked timer sound files in `public/media/sounds/`
- Behavior changes:
  - timer start sound now plays once when a session begins
  - interval sound now plays from elapsed timer milestones rather than render timing
  - end sound now plays once on natural completion and on intentional early stop
  - pause/resume preserves interval correctness and does not replay the start sound
  - recovered active sessions do not replay already-passed cues on hydration
  - timer playback failures now surface one calm warning while keeping the session usable
- Media and workflow changes:
  - timer sound labels resolve through `src/data/timerSoundCatalog.json`
  - runtime playback requests `/media/sounds/<filename>`
  - `npm run media:setup` now prepares and mirrors timer sound roots for both:
    - `public/media/sounds/`
    - `local-data/media/sounds/`
  - `npm run sound:add -- --file ...` or `--filename ...` now updates the playback mapping as well as the selectable label list
- Verification completed:
  - passed `npm run media:setup`
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - completed a local browser verification on `http://127.0.0.1:5173/practice`
  - confirmed runtime requests for:
    - `/media/sounds/soft-chime.wav` on session start
    - `/media/sounds/wood-block.wav` on interval cue
    - `/media/sounds/temple-bell.wav` on session completion
    - one additional `/media/sounds/temple-bell.wav` request on intentional early stop
- Important limitations:
  - the local browser verification confirmed sound-file requests through the real runtime path, but automated verification could not listen to audible output directly
  - browser autoplay rules can still block playback depending on the interaction context
  - playlist runtime playback is still not implemented
- Exact recommended next prompt:
  - `Implement a bounded vertical slice for timer sound preview controls in the meditation app. Add tap-safe preview actions beside the existing sound selectors in Practice timer setup, Settings, and Custom Plays using the shared timer sound catalog and playback helper. Keep the UX calm and mobile-friendly, fail safely when audio is blocked or missing, add focused tests, update README plus decisions/session-handoff, run typecheck/lint/test/build, do a local browser check, and commit with a clear message. Exclude playlist runtime playback, uploads, and backend media APIs.`

## 2026-03-27 sound and prerecorded-media registration scripts
- Added and updated:
  - `requirements/execplan-media-registration-scripts.md`
  - `docs/media-registration-scripts.md`
  - `scripts/media-registration-utils.mjs`
  - `scripts/add-sound-option.mjs`
  - `scripts/add-custom-play-media.mjs`
  - `package.json`
  - `README.md`
  - `src/data/meditationTypes.json`
  - `src/data/soundOptions.json`
  - `src/data/customPlayMediaCatalog.json`
  - `src/features/timer/constants.ts`
  - `src/utils/mediaAssetApi.ts`
  - `src/test/setup.ts`
- Workflow changes:
  - `npm run sound:add -- --label "..."` adds a new selectable timer sound label
  - `npm run media:add:custom-play -- ...` registers a prerecorded `custom play` media asset, updates the frontend fallback catalog, and creates a new backend Flyway migration
  - both scripts support `--help`
  - both scripts support `--dry-run`
- Important implementation notes:
  - sound registration does not implement playback
  - prerecorded-media registration intentionally creates a new migration instead of editing `V2__seed_reference_data.sql`
- Verification completed:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - verified `npm run sound:add -- --help`
  - verified `npm run sound:add -- --label "Crystal Bowl" --dry-run`
  - verified `npm run media:add:custom-play -- --help`
  - verified `npm run media:add:custom-play -- --id media-sahaj-evening-25 --label "Sahaj Evening Sit (25 min)" --meditation-type Sahaj --filename sahaj-evening-25.mp3 --duration-minutes 25 --size-bytes 11000000 --dry-run`
- Exact recommended next prompt:
  - `Implement a small automated smoke-test harness for the media registration CLIs. Include focused verification that dry-run output is stable, JSON catalogs remain sorted/valid, generated migration filenames increment correctly, docs stay aligned, and the required project verification commands still pass.`

## Current status prior to this slice
Managed local app-stack scripting is now implemented on top of the existing full-stack repo. The workspace has build, start, stop, restart, status, and log helpers for the local frontend/backend stack, with the embedded-H2 lifecycle documented explicitly.

## 2026-03-27 managed local app-stack scripting
- Added and updated:
  - `requirements/execplan-devops-local-scripting.md`
  - `scripts/app-start.sh`
  - `scripts/app-stop.sh`
  - `scripts/app-restart.sh`
  - `scripts/app-status.sh`
  - `scripts/app-logs.sh`
  - `scripts/common.sh`
  - `scripts/dev-frontend.sh`
  - `scripts/preview-local.sh`
  - `package.json`
  - `.env.example`
  - `README.md`
- Operator workflow changes:
  - `npm run build:app` remains the one-command frontend and backend build helper
  - `npm run start:app` now starts the managed backend and frontend in the background, waits for health, and writes runtime state under `local-data/runtime`
  - `npm run stop:app` stops only the managed processes launched by `start:app`
  - `npm run restart:app` restarts the managed frontend and backend
  - `npm run restart:app -- --no-db` now restarts only the frontend so the current backend process and embedded H2 state remain up
  - `npm run status:app` and `npm run logs:app` provide basic operator-safe inspection helpers
- Important implementation note:
  - the repo still uses file-backed H2 inside the backend process, so there is no standalone DB daemon to stop or restart independently
- Remaining limitations:
  - the managed stop helper intentionally does not kill unrelated processes that were not started through the managed scripts
  - live startup verification may still require unsandboxed local port binding in some environments
- Verification completed:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `npm run build:app`
  - passed `npm run media:setup`
  - passed `npm run db:h2:reset`
  - verified `npm run start:app`
  - verified `npm run status:app`
  - verified `curl -s http://localhost:8080/api/health`
  - verified `curl -s http://localhost:5173 | head -n 3`
  - verified `npm run restart:app -- --no-db`
  - verified `npm run stop:app`
- Exact recommended next prompt:
  - `Implement a local smoke-check helper for the managed app stack. Include a script that starts from a clean managed state, verifies backend health and frontend reachability, confirms PID/log creation, exercises restart:app -- --no-db, stops the managed stack, updates README plus handoff/decisions, runs the relevant verification commands, and commits with a clear message.`

## Current milestone snapshot
Milestone E is complete and merged into `codex/functioning`. The parent branch now contains the full hardening slice, the working tree is clean, and there is no remaining checked-in prompt file for this milestone sequence.

## Milestone E branch setup
- Parent branch: `codex/functioning`
- Milestone branch: `codex/milestone-e-hardening-release`
- Working tree status at branch setup: clean and ready for milestone work
- Milestone E scope:
  - release-hardening review across usability, code quality, performance, backend hygiene, API design quality, testing quality, and deployment/readme clarity
  - remediation of critical and important hardening findings
  - accessibility and responsive polish across mobile, tablet, and desktop
  - end-to-end verification, release-readiness checks, and local merge back to the parent branch
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/01-code-quality-performance-hygiene-review.md`

## Milestone E prompt 01: release-hardening review
- Added:
  - `docs/review-release-hardening.md`
- Review result:
  - critical issues: none
  - important issues:
    - `src/features/timer/TimerContext.tsx` is now the main maintainability and performance hotspot, with duplicated hydration branches and repeated JSON serialization for queue keys and collection equality checks
    - local media setup guidance is inconsistent between `README.md`, helper scripts, and backend defaults, which can send operators to the wrong directory during full-stack verification
  - nice-to-have issues:
    - the repo still lacks a browser-level smoke or end-to-end harness for connected-runtime verification
    - backend Maven verification still emits a Flyway/H2 compatibility warning even though the build passes
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/02-remediate-code-quality-performance-hygiene.md`

## Milestone E prompt 02: remediation
- Added and used:
  - `requirements/execplan-milestone-e-hardening-remediation.md`
  - `src/features/timer/queueCollectionSync.ts`
- Frontend hardening changes:
  - extracted shared queue-backed collection reconciliation helpers out of `src/features/timer/TimerContext.tsx`
  - replaced JSON-stringification-based queue signatures and collection equality checks with reusable domain-aware helpers for `custom play`, playlist, and `session log` state
  - kept existing local-first sync behavior intact while making the `custom play` and playlist hydration branches reuse one reconciliation path
- Operational clarity changes:
  - updated media-root helper scripts so `npm run media:setup` prepares both:
    - `public/media/custom-plays`
    - `local-data/media/custom-plays`
  - updated `README.md` so local media setup and validation instructions match the actual helper and backend defaults
- Tests:
  - added focused helper coverage in `src/features/timer/queueCollectionSync.test.ts`
  - extended domain-helper coverage in:
    - `src/utils/customPlay.test.ts`
    - `src/utils/playlist.test.ts`
    - `src/utils/sessionLog.test.ts`
- Verification:
  - passed `npm run media:setup`
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Remaining nice-to-have issues from the review:
  - the repo still lacks a browser-level smoke or end-to-end harness
  - backend Maven verification still emits a Flyway/H2 compatibility warning
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/03-accessibility-responsive-polish.md`

## Milestone E prompt 03: accessibility and responsive polish
- Added and used:
  - `requirements/execplan-milestone-e-accessibility-responsive-polish.md`
- Accessibility changes:
  - added `aria-invalid` and `aria-describedby` wiring plus stable hint and error ids on the validation-heavy form controls in:
    - `Practice`
    - `Settings`
    - manual log in `History`
    - `custom play`
    - playlist management
  - kept the existing validation copy and calm interaction model while making hint text and inline errors more reliably associated with each control
- Responsive polish:
  - added calm two-column management layouts for `custom play` and playlist management on wider screens
  - kept those same surfaces stacked on phone-sized layouts so controls remain touch-friendly and easy to scan
  - refined the manual-log disclosure summary layout so the collapsed/expanded affordance reads more cleanly across breakpoints
- Tests:
  - added focused accessibility assertions in:
    - `src/pages/PracticePage.test.tsx`
    - `src/pages/SettingsPage.test.tsx`
    - `src/pages/HistoryPage.test.tsx`
  - updated `src/App.test.tsx` manual-log queries to stay aligned with the more descriptive accessible labels
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test` from `/Users/prashantwani/wrk/meditation/backend`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify` from `/Users/prashantwani/wrk/meditation/backend`
  - completed a local responsive spot-check on `http://127.0.0.1:4174`
- Known limitations:
  - the local preview spot-check used frontend fallback states because no backend was attached to the preview server
  - backend Maven verification still emits the existing Flyway/H2 compatibility warning even though the build passes
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/04-e2e-verification.md`

## Milestone E prompt 04: end-to-end verification
- Added and used:
  - `requirements/execplan-milestone-e-e2e-verification.md`
- Connected local stack verified:
  - frontend `http://127.0.0.1:5174`
  - backend `http://127.0.0.1:8081`
  - isolated H2 database name `meditation-prompt04`
- Verification-driven fixes:
  - fixed a React StrictMode lifecycle bug in `src/features/timer/TimerContext.tsx` so queue-backed sync flushes still run after the initial development mount cycle
  - shortened playlist-generated `session log` ids in `src/utils/playlistLog.ts` so playlist auto-log and ended-early flows fit the backend `session_log.id varchar(64)` limit
- Test coverage updates:
  - wrapped the existing backend timer-settings rehydration app test in `StrictMode` within `src/App.test.tsx` so prompt 04 covers the real app lifecycle
  - added focused playlist log id-length coverage in `src/utils/playlistLog.test.ts`
- Documentation updates:
  - updated `README.md` with the exact verified connected backend and frontend commands
  - documented that Vite dev proxies `/api`, while Vite preview requires an explicit `VITE_API_BASE_URL`
  - added backend Maven verification commands to the README verification snapshot
- Live browser verification completed for:
  - Home
  - Settings save and reload
  - manual log save in History
  - `custom play` creation and timer apply
  - playlist creation, run launch, ended-early logging, and History visibility
  - Sankalpa creation and Home snapshot visibility
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test` from `/Users/prashantwani/wrk/meditation/backend`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify` from `/Users/prashantwani/wrk/meditation/backend`
- Known limitations:
  - backend Maven verification still emits the existing Flyway/H2 compatibility warning even though the build passes
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/05-release-readiness.md`

## Milestone E prompt 05: release readiness
- Added and used:
  - `requirements/execplan-milestone-e-release-readiness.md`
- Documentation hardening:
  - clarified in `README.md` that Vite preview is network-accessible but does not proxy `/api`
  - clarified that connected preview checks require a build created with `VITE_API_BASE_URL`, unless the backend is served from the same origin as the built app
  - kept the local dev, LAN, media, backend/H2, and offline/sync guidance grounded in the helper scripts and verified runtime behavior
- Release-readiness verification:
  - passed `npm run media:setup`
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `npm run build:app`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test` from `/Users/prashantwani/wrk/meditation/backend`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify` from `/Users/prashantwani/wrk/meditation/backend`
- Helper-command startup smoke checks:
  - `npm run dev:backend` served backend health on `http://localhost:8080/api/health`
  - `npm run dev:frontend` served the app on `http://localhost:5173/`
  - the dev proxy reached backend health at `http://localhost:5173/api/health`
  - `npm run preview:app` served the built app on `http://localhost:4173/`
- LAN/Wi-Fi reachability verified from the developer machine using LAN address `192.168.68.76`:
  - backend health `http://192.168.68.76:8080/api/health`
  - dev frontend `http://192.168.68.76:5173/`
  - preview frontend `http://192.168.68.76:4173/`
- Release blocker check:
  - no new blockers found for the local release-candidate handoff
  - remaining non-blocking limitations are still:
    - timer and playlist sound playback is UI-only
    - richer `custom play` media-library management is not implemented
    - `sankalpa` edit/archive/delete flows are not implemented
    - backend Maven verification still emits the known Flyway/H2 compatibility warning even though `verify` passes
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/99-merge-branch.md`

## Milestone E merge completion
- Parent branch updated:
  - `codex/functioning`
- Merged milestone branch:
  - `codex/milestone-e-hardening-release`
- Resulting git status:
  - clean working tree after merge and final handoff updates
- Milestone E completion summary:
  - reviewed the release-hardening surface and recorded findings in `docs/review-release-hardening.md`
  - remediated the main `TimerContext` maintainability and sync-performance hotspot with shared queue reconciliation helpers
  - improved accessible validation semantics and calmer responsive management layouts across key screens
  - completed live connected full-stack verification and fixed:
    - the StrictMode timer sync lifecycle regression
    - playlist-generated `session log` ids exceeding backend length limits
  - verified release-candidate helper commands, localhost startup, LAN reachability, media setup, and preview guidance
- Exact recommended next prompt:
  - no further checked-in prompt file remains after `prompts/milestone-e-hardening-release/99-merge-branch.md`

## Milestone D branch setup
- Parent branch: `codex/functioning`
- Milestone branch: `codex/milestone-d-offline-sync-fullstack`
- Working tree status at branch setup: clean and ready for milestone work
- Milestone D scope:
  - offline-first architecture foundations
  - front-end offline behavior and sync queue support for implemented domains
  - backend reconciliation and sync-safe duplicate handling
  - milestone review, remediation, verification, and local merge back to the parent branch
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/01-offline-architecture.md`

## Milestone D prompt 01: offline architecture
- Added and used:
  - `requirements/execplan-milestone-d-offline-architecture.md`
- Frontend architecture changes:
  - added shared sync types in `src/types/sync.ts`
  - added browser-persisted sync queue helpers in `src/utils/syncQueue.ts`
  - added app-level connectivity and queue visibility under `src/features/sync/`
  - wrapped the app in `SyncStatusProvider` so later prompts can reuse one shared offline/sync context
  - updated `AppShell` to show calm offline and pending-sync status banners
- Documentation changes:
  - updated `README.md` to describe the offline-first sync foundations
  - updated `docs/architecture.md` with the new offline/sync module boundaries
- Tests:
  - added queue persistence and queue-state coverage in `src/utils/syncQueue.test.ts`
  - added sync-provider coverage in `src/features/sync/SyncStatusProvider.test.tsx`
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/02-offline-frontend-and-sync-queue.md`

## Milestone D prompt 02: offline frontend and sync queue
- Added and used:
  - `requirements/execplan-milestone-d-offline-frontend-sync-queue.md`
- Frontend behavior changes:
  - made timer settings saves local-first and queue-backed so changes remain visible offline and replay through `/api/settings/timer`
  - made `session log` creation and update flows local-first, including manual logs, with deferred sync through `/api/session-logs`
  - made `custom play` and playlist save, delete, and favorite flows local-first while preserving backend-backed hydration
  - made `sankalpa` saves local-first and queue-backed while keeping calm fallback guidance on the `Sankalpa` screen
  - updated hydration to overlay queued local mutations on backend data so stale backend reads do not erase unsynced edits or resurrect deleted records
  - kept shell and feature copy calm and explicit when sync is pending or the browser is offline
- Architecture and implementation notes:
  - `src/features/timer/TimerContext.tsx` now owns queue-backed hydration and replay for timer settings, `session log`, `custom play`, and playlist entities
  - `src/features/sankalpa/useSankalpaProgress.ts` now owns queue-backed `sankalpa` replay and offline loading behavior
  - `src/utils/syncQueue.ts` now includes helpers for selecting queue-visible records and returning failed entries to pending retry state
- Tests:
  - updated app-level offline and pending-sync coverage in `src/App.test.tsx`
  - updated timer, `custom play`, `History`, playlist, `Sankalpa`, `Practice`, and `Settings` tests to assert local-first offline behavior and calm deferred-sync messaging
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
- Known limitations:
  - backend reconciliation and duplicate-safe replay handling are not implemented yet
  - conflict resolution still assumes the current single-user local-development model
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/03-sync-endpoints-and-reconciliation.md`

## Milestone D prompt 03: sync endpoints and reconciliation
- Added and used:
  - `requirements/execplan-milestone-d-sync-endpoints-and-reconciliation.md`
- Frontend sync-boundary changes:
  - added `src/utils/syncApi.ts` so queued flushes can send one shared sync timestamp header through the existing REST helpers
  - updated timer settings, `session log`, `custom play`, playlist, and `sankalpa` API helpers to attach queued-mutation metadata during replay
  - updated `TimerContext` and `useSankalpaProgress` queue flushes to pass queue timestamps into backend writes
- Backend reconciliation changes:
  - kept the existing REST routes and added sync-safe behavior instead of introducing separate sync endpoints
  - made timer settings reject stale queued writes in favor of newer backend-backed state
  - made `custom play` and playlist upserts preserve client creation timestamps for offline-created data and ignore stale queued updates or deletes
  - made `session log` upserts retry-safe through stable-id replay and stale queued retry protection
  - kept the current `sankalpa` replay model simple and id-stable because the UI still exposes create-only saves in this milestone
- Tests:
  - updated frontend API-boundary tests to prove queued sync metadata is sent on replay
  - added backend controller coverage for stale queued timer-settings, `custom play`, playlist, and `session log` mutations
  - tightened `TimerSettingsControllerTest` isolation by resetting the default row before each test
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Known limitations:
  - deletion reconciliation does not use tombstones, so newer backend-backed records reappear on the next hydration rather than surfacing a dedicated conflict workflow
  - multi-device or multi-user conflict resolution is still intentionally out of scope for this milestone
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/04-review-offline-sync-fullstack.md`

## Milestone D prompt 04: review
- Added:
  - `docs/review-offline-sync-fullstack.md`
- Review result:
  - critical issues: none
  - important issues:
    - `sankalpa` queue replay re-fetches and re-enqueues on every queue mutation, which can reset failed entries and create unnecessary backend traffic
    - stale queued deletes for `custom play` and playlist records currently resolve as silent success, so deleted records can later reappear without an explicit conflict message
  - nice-to-have issues:
    - stale-write protection currently depends on client-supplied queued timestamps rather than a server receipt or monotonic version
    - `session log` stale-retry protection is only strong enough for the current append-style flow
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/05-remediate-offline-sync-fullstack.md`

## Milestone D prompt 05: remediation
- Added and used:
  - `requirements/execplan-milestone-d-offline-sync-remediation.md`
- Frontend remediation changes:
  - updated `src/features/timer/TimerContext.tsx` so stale queued deletes for `custom play` and playlist records restore the latest backend-backed record locally and show calm inline warning copy instead of silently succeeding
  - updated `src/utils/customPlayApi.ts` and `src/utils/playlistApi.ts` so delete requests can distinguish true deletes from explicit `"stale"` outcomes returned by the backend
  - updated `src/features/sankalpa/useSankalpaProgress.ts` so replay tracking ignores queue state-only churn and does not re-enqueue already queued `sankalpa` goals during backend hydration
- Backend remediation changes:
  - updated `/api/custom-plays/{id}` and `/api/playlists/{id}` delete handling to return an explicit stale-delete result payload when a queued delete loses to newer backend-backed state
  - kept true successful deletes at `204 No Content` so the REST boundary stays clean for non-conflict cases
- Tests:
  - added focused frontend UX coverage for stale delete restoration in:
    - `src/features/customPlays/CustomPlayManager.test.tsx`
    - `src/pages/PlaylistsPage.test.tsx`
  - added helper-level replay coverage in:
    - `src/features/sankalpa/useSankalpaProgress.test.ts`
  - updated existing sankalpa app coverage to assert failed sync attempts are not replayed repeatedly on queue metadata churn
  - updated backend controller tests and frontend API-boundary tests for explicit stale delete outcomes
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Known limitations:
  - stale-write protection still depends on client-supplied queued timestamps in the current local-development model
  - `session log` stale protection is still intentionally scoped to the current append-style retry flow
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/06-test-offline-sync-fullstack.md`

## Milestone D prompt 06: testing
- Added and used:
  - `requirements/execplan-milestone-d-offline-sync-testing.md`
- Test additions:
  - added app-level offline-startup coverage in `src/App.test.tsx` proving cached `session log` state remains visible while offline and flushes successfully after reconnection
  - added app-level partial-failure coverage in `src/App.test.tsx` proving queued offline work can succeed partially, keep failed work visible, and retry only the failed entry on the next online transition
  - reused the existing stateful backend fetch mock so prompt 06 strengthens milestone confidence without introducing a second test harness
- Coverage summary for prompt 06:
  - online startup is covered through existing Home, Practice, Settings, and fresh-mount backend hydration tests
  - offline startup, offline actions, reconnection, sync success, and partial-failure retry now have explicit app-level coverage
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/99-merge-branch.md`

## Milestone D merge
- Milestone branch merged:
  - `codex/milestone-d-offline-sync-fullstack`
- Parent branch updated:
  - `codex/functioning`
- Merge strategy:
  - normal local merge commit preserving milestone history
- Resulting git status:
  - clean
- Milestone completion summary:
  - added a shared offline/sync foundation under `src/features/sync/` and `src/utils/syncQueue.ts`
  - made implemented backend-backed write flows local-first with browser-persisted deferred replay for timer settings, `session log`, `custom play`, playlist, and `sankalpa`
  - added backend reconciliation through the existing REST routes with stale-write protection and idempotent replay boundaries
  - remediated `sankalpa` replay churn and stale queued delete handling for `custom play` and playlist records
  - expanded app-level verification for offline startup, offline actions, reconnection, sync success, and partial-failure retry flows
- Exact recommended next prompt:
  - `prompts/milestone-e-hardening-release/00-create-branch.md`

## Milestone C branch setup
- Parent branch: `codex/functioning`
- Milestone branch: `codex/milestone-c-discipline-insight-fullstack`
- Working tree status at branch setup: clean and ready for milestone work
- Milestone C scope:
  - summary REST support
  - sankalpa REST persistence and progress support
  - milestone review, remediation, verification, and local merge back to the parent branch
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/01-summaries-rest.md`

## Milestone C prompt 01: summaries REST
- Added and used:
  - `requirements/execplan-milestone-c-summaries-rest.md`
- Backend changes:
  - added summary aggregate package under `backend/src/main/java/com/meditation/backend/summary/`
  - added backend route:
    - `GET /api/summaries`
  - added optional inclusive `startAt` / `endAt` ISO filtering against persisted `session log` `endedAt`
  - derived backend summary aggregates for:
    - overall
    - by meditation type
    - by source
    - by time-of-day bucket
- Frontend changes:
  - added `src/utils/summaryApi.ts` as the typed REST boundary for summary loading
  - updated `SankalpaPage` to request backend summary data for the selected range
  - preserved local derived summary fallback from hydrated `session log` data when the summary API is unavailable
  - added calm summary refresh copy and explicit fallback guidance without changing the existing calm layout
- Tests:
  - added frontend API-boundary coverage in `src/utils/summaryApi.test.ts`
  - updated `src/pages/SankalpaPage.test.tsx` for backend-summary success and fallback behavior
  - added backend controller coverage in `backend/src/test/java/com/meditation/backend/summary/SummaryControllerTest.java`
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/02-sankalpa-rest.md`

## Milestone C prompt 02: sankalpa REST
- Added and used:
  - `requirements/execplan-milestone-c-sankalpa-rest.md`
- Backend changes:
  - added backend `sankalpa` package under `backend/src/main/java/com/meditation/backend/sankalpa/`
  - added backend route:
    - `GET /api/sankalpas`
    - `PUT /api/sankalpas/{id}`
  - added H2 migration:
    - `backend/src/main/resources/db/migration/V7__allow_fractional_sankalpa_targets.sql`
  - moved `sankalpa` goal persistence into H2 and derived progress from persisted `session log` rows
  - preserved duration-goal precision by storing fractional `target_value`
- Frontend changes:
  - replaced the local-only `sankalpa` API shim in `src/utils/sankalpaApi.ts` with live REST list/upsert helpers
  - added `src/features/sankalpa/useSankalpaProgress.ts` to centralize backend hydration, local-cache fallback, and id-preserving migration of older local goals
  - updated `HomePage` to load the `Sankalpa Snapshot` from backend-backed progress
  - updated `SankalpaPage` to save new goals through the backend while keeping calm fallback guidance when the backend is unavailable
- Tests:
  - added backend controller coverage in `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
  - updated `src/utils/sankalpaApi.test.ts` for live REST response normalization
  - added Home UI coverage proving the `Sankalpa Snapshot` can render backend-loaded progress
  - updated shared helper coverage in `src/utils/home.test.ts`
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Known limitations:
  - `sankalpa` editing, deletion, and archive management are still not implemented
  - frontend local fallback still derives progress client-side when the backend is unavailable
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/03-review-discipline-insight-fullstack.md`

## Milestone C prompt 03: review
- Added:
  - `docs/review-discipline-insight-fullstack.md`
- Review result:
  - critical issues: none
  - important issues:
    - `sankalpa` save fallback currently writes to local storage for any API failure, which can diverge the UI from the H2-backed source of truth
    - backend time-of-day bucketing depends on server timezone and can disagree with browser-local fallback behavior
  - nice-to-have issues:
    - fallback `sankalpa` saves are styled like success instead of degraded persistence
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/04-remediate-discipline-insight-fullstack.md`

## Milestone C prompt 04: remediation
- Added and used:
  - `requirements/execplan-milestone-c-discipline-insight-remediation.md`
- Backend changes:
  - updated `GET /api/summaries` to accept an optional `timeZone` query parameter for time-of-day aggregation
  - updated `GET /api/sankalpas` and `PUT /api/sankalpas/{id}` to accept an optional `timeZone` query parameter for time-of-day filter evaluation
  - added explicit invalid-time-zone validation so malformed IANA zone ids return `400` instead of silently using the backend host timezone
- Frontend changes:
  - added `src/utils/timeZone.ts` to resolve the browser's IANA time zone when available
  - updated `src/utils/summaryApi.ts` and `src/utils/sankalpaApi.ts` to send the browser time zone to the backend
  - tightened `src/features/sankalpa/useSankalpaProgress.ts` so local `sankalpa` save fallback only happens for network failures
  - kept backend rejections as inline errors on `SankalpaPage` and styled degraded fallback feedback as a warning instead of a clean success state
- Tests:
  - added backend controller coverage for time-zone-aware summary bucketing and sankalpa time-of-day filtering
  - updated frontend API-boundary tests for time-zone query handling
  - added `SankalpaPage` coverage proving rejected backend saves do not persist local divergent goals
  - updated `HomePage` backend snapshot coverage for the new `timeZone` query parameter
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Known limitations:
  - `sankalpa` editing, deletion, and archive management are still not implemented
  - frontend summary fallback still derives buckets locally when the summary API is unavailable
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/05-test-discipline-insight-fullstack.md`

## Milestone C prompt 05: testing
- Added and used:
  - `requirements/execplan-milestone-c-discipline-insight-testing.md`
- Test additions:
  - added a stateful app-level integration test in `src/App.test.tsx` proving a backend-backed manual log created in `History` flows through to both `summary` and `sankalpa` on the `Sankalpa` screen, including a fresh mount
  - extended the shared app-test backend mock to derive backend summary aggregates and sankalpa progress from in-memory `session log` and `sankalpa` state
  - added invalid `timeZone` rejection coverage in:
    - `backend/src/test/java/com/meditation/backend/summary/SummaryControllerTest.java`
    - `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
- Verification:
  - passed `npm run typecheck`
  - passed `npm run lint`
  - passed `npm run test`
  - passed `npm run build`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 test`
  - passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Exact recommended next prompt:
  - `prompts/milestone-c-discipline-insight-fullstack/99-merge-branch.md`

## Milestone C merge
- Milestone branch merged:
  - `codex/milestone-c-discipline-insight-fullstack`
- Parent branch updated:
  - `codex/functioning`
- Merge strategy:
  - normal local merge commit preserving milestone history
- Milestone completion summary:
  - backend-backed `summary` support is now in place with explicit time-zone-aware aggregation
  - backend-backed `sankalpa` persistence and derived progress are now in place with H2-backed source-of-truth behavior
  - review, remediation, and testing prompts are complete, including safer local fallback boundaries and stronger interaction coverage
- Resulting git status after merge:
  - clean on `codex/functioning`
- Exact recommended next prompt:
  - `prompts/milestone-d-offline-sync-fullstack/00-create-branch.md`

## Milestone B branch setup
- Parent branch: `codex/functioning`
- Milestone branch: `codex/milestone-b-practice-composition-fullstack`
- Working tree status at branch setup: clean and ready for milestone work
- Milestone B scope:
  - manual `session log` REST persistence for manual logging
  - media catalog metadata + filesystem path references + `custom play` REST persistence
  - playlist and playlist-item REST persistence
  - milestone review, remediation, verification, and local merge back to the parent branch

## Milestone B prompt 01: manual logging REST
- Added and used:
  - `requirements/execplan-milestone-b-manual-logging-rest.md`
- Backend changes:
  - added dedicated manual-log create endpoint:
    - `POST /api/session-logs/manual`
  - added backend-owned manual-log validation and record construction in `sessionlog` service code
  - kept manual logs in the shared H2-backed `session_log` table and shared response contract
- Frontend changes:
  - History manual-log submission now posts manual-log input to the dedicated backend route instead of fabricating a full `session log` entry client-side
  - `sessionLogApi` now exposes a dedicated manual-log create helper while preserving the existing generic `session log` sync helpers
  - manual-log helpers now normalize a backend create request shape from the History form input
- Tests:
  - added frontend coverage for manual-log create-request normalization and the dedicated API endpoint helper
  - added backend controller coverage for successful and invalid manual-log creation
  - updated History test backend mocks for the new manual-log route
  - fixed `SessionLogControllerTest` isolation by clearing stored `session log` rows between tests

## Milestone B prompt 02: media catalog and custom plays REST
- Added and used:
  - `requirements/execplan-milestone-b-media-catalog-custom-plays-rest.md`
- Backend changes:
  - added H2 migration `V4__add_custom_play_sound_fields.sql` to align the `custom_play` table with the current frontend sound fields
  - added backend `custom play` repository, service, controller, request, and response contracts under `backend/src/main/java/com/meditation/backend/customplay/`
  - added backend routes:
    - `GET /api/custom-plays`
    - `PUT /api/custom-plays/{id}`
    - `DELETE /api/custom-plays/{id}`
  - validated optional linked `media asset` ids against active `custom-play` media rows
- Frontend changes:
  - added `src/utils/customPlayApi.ts` as the shared REST boundary for list, upsert, and delete
  - updated `TimerContext` to hydrate `custom play` data from the backend, migrate older local entries forward on first load, and preserve local cache fallback behavior
  - made `custom play` save, delete, and favorite actions async so Practice feedback reflects backend persistence truthfully
  - kept the existing `CustomPlay` screen contract stable for the rest of the app
- UX and documentation changes:
  - added calm loading and sync banners for backend-backed `custom play` work inside Practice tools
  - documented local media placement under `local-data/media/custom-plays/` and the backend media-asset mapping expectations
- Tests:
  - added frontend API-boundary tests for `custom play` response normalization and delete failure handling
  - updated `CustomPlayManager` tests for backend-backed save/delete/favorite flows and loading/sync states
  - added backend repository and controller tests for `custom play` list/save/delete validation paths

## Milestone B prompt 03: playlists REST
- Added and used:
  - `requirements/execplan-milestone-b-playlists-rest.md`
- Backend changes:
  - added H2 migration `V5__add_playlist_rest_support.sql`
    - adds stable `playlist_item.external_id` support for browser-created playlist-item ids
    - updates playlist-delete behavior so historical `session log` rows keep readable playlist context while `playlist_id` can null out safely
  - added backend playlist repository, item repository, service, controller, request, and response contracts under `backend/src/main/java/com/meditation/backend/playlist/`
  - added backend routes:
    - `GET /api/playlists`
    - `PUT /api/playlists/{id}`
    - `DELETE /api/playlists/{id}`
- Frontend changes:
  - replaced the local-only playlist seam in `src/utils/playlistApi.ts` with live playlist list/upsert/delete HTTP helpers
  - updated `TimerContext` to hydrate playlists from the backend, promote older local playlists on first load, and keep browser cache fallback behavior
  - made playlist save, delete, and favorite actions async so playlist management feedback reflects backend persistence truthfully
  - kept active playlist-run recovery local-first while playlist definitions now come from backend hydration
- Playlist logging behavior:
  - kept per-item playlist `session log` behavior intact through the existing generic `session log` sync path
  - preserved readable History context after playlist deletion through stored snapshot metadata:
    - `playlistName`
    - `playlistRunId`
    - `playlistRunStartedAt`
    - item position/count
- UX and tests:
  - added calm load/sync banners for backend-backed playlist management
  - preserved cached playlist run launching while backend hydration is in flight
  - added frontend API-boundary tests for playlist list/upsert/delete transport
  - added backend repository/controller coverage for playlist persistence and history-safe delete behavior

## Milestone B prompt 04: review
- Added:
  - `docs/review-practice-composition-fullstack.md`
- Review result:
  - critical issues: none
  - important issues:
    - playlist delete failures currently surface the wrong user message
    - playlist runs can start from stale cached definitions before backend hydration completes
    - globally unique playlist-item external ids can still fail as an unhandled server-side constraint error across playlists
  - nice-to-have issues:
    - `TimerContext` is carrying too many milestone responsibilities
- Prompt 04 intentionally made no code changes.

## Milestone B prompt 05: remediation
- Added and used:
  - `requirements/execplan-milestone-b-practice-composition-remediation.md`
- Frontend changes:
  - added an explicit `playlists loading` launch-block reason so playlist runs cannot start from stale cached definitions before backend hydration completes
  - disabled playlist run actions on `Practice` and favorite playlist shortcuts on `Home` while playlist hydration is still in flight, with calm loading copy to explain the wait
  - returned truthful playlist delete persistence failures from `TimerContext` so Practice only shows the active-run delete message for real run conflicts
- Backend changes:
  - added H2 migration `V6__scope_playlist_item_external_id_uniqueness.sql`
  - scoped playlist-item `external_id` uniqueness to `(playlist_id, external_id)` so different playlists can safely reuse the same browser-created item ids
- Tests:
  - expanded frontend coverage for playlist loading gates and truthful delete failure guidance in:
    - `src/utils/playlistRunPolicy.test.ts`
    - `src/pages/PlaylistsPage.test.tsx`
    - `src/pages/HomePage.test.tsx`
    - `src/features/timer/TimerContext.test.tsx`
  - added backend controller coverage proving different playlists can reuse the same playlist-item id without a server error

## Milestone B review findings summary
- Critical:
  - none recorded in `docs/review-practice-composition-fullstack.md`
- Important:
  - prompt 05 remediated all three important review findings
- Nice-to-have:
  - `TimerContext` still carries too many milestone responsibilities and remains a future maintainability slice

## Milestone B prompt 06: testing
- Added and used:
  - `requirements/execplan-milestone-b-practice-composition-testing.md`
- Test additions:
  - expanded `src/App.test.tsx` with backend-backed fresh-mount integration coverage for:
    - manual log creation -> History rehydration
    - custom play creation -> Practice rehydration
    - playlist run auto logs -> History rehydration
  - extended the existing stateful backend fetch mock only as far as needed to cover Milestone B manual-log, custom-play, and playlist persistence seams
- Verification:
  - re-ran:
    - `npm run typecheck`
    - `npm run lint`
    - `npm run test`
    - `npm run build`
    - `mvn -Dmaven.repo.local=../local-data/m2 test`
    - `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Milestone B merge status
- Parent branch updated: `codex/functioning`
- Merged milestone branch: `codex/milestone-b-practice-composition-fullstack`
- Merge strategy: normal local merge commit preserving milestone history

## Milestone B completion summary
- Completed the backend-backed practice-composition vertical slice for:
  - manual `session log` persistence
  - media catalog-backed `custom play` persistence
  - playlist persistence and playlist-run history continuity
- Closed the important practice-composition review findings before merge:
  - truthful playlist delete feedback
  - backend-hydration gating for playlist launches
  - playlist-item external-id uniqueness scoped safely for reused browser ids
- Finished with milestone-level integration coverage proving backend-backed fresh-mount continuity for:
  - manual logs
  - custom plays
  - playlist-run history

## Milestone B verification status
- Passed `npm run typecheck`
- Passed `npm run lint`
- Passed `npm run test`
- Passed `npm run build`
- Passed `mvn -Dmaven.repo.local=../local-data/m2 test`
- Passed `mvn -Dmaven.repo.local=../local-data/m2 verify`

## Milestone B known limitations
- Sankalpa CRUD is still local-first in the frontend.
- Media catalog browsing still depends on the seeded backend media metadata surface plus frontend fallback assumptions.
- Playlist-generated `session log` entries still sync through the existing generic `session log` path, now against backend-backed playlist ids and snapshot metadata.
- Timer and playlist sound playback remain UI-only.

## Milestone branch setup
- Parent branch: `codex/functioning`
- Milestone branch: `codex/prompts/milestone-a-core-fullstack`
- Milestone scope:
  - session log REST persistence
  - timer completion record support needed by the core flow
  - settings/preferences persistence needed by the core flow
  - Home, Practice, active timer, and History backend integration
  - milestone review, remediation, verification, and local merge back to the parent branch
- Working tree status at branch creation: clean and ready for milestone work

## Merge status
- Milestone branch merged: `codex/prompts/milestone-a-core-fullstack`
- Parent branch updated: `codex/functioning`
- Merge strategy used: normal local merge commit preserving milestone history
- Merge commit on parent branch: `4457def`

Prompt 01 established the H2-backed REST contracts and frontend hydration/sync path for timer settings and `session log` history. Prompt 02 completed the user-facing core practice-engine flow on top of that foundation by tightening Home and Practice launch behavior, adding fresh-mount integration coverage, and verifying the runnable local stack end to end. Prompt 03 reviewed that milestone slice without code changes and identified the bounded issues to remediate next. Prompt 04 then fixed those important issues with a small, focused remediation pass. Prompt 05 finished the milestone with a strong verification pass across automated coverage, backend persistence, and isolated live runtime checks.

Milestone A now lives on the parent branch with its milestone branch history preserved.

## What was changed
- Added and used:
  - `requirements/execplan-milestone-a-session-log-rest.md`
  - `requirements/execplan-milestone-a-core-practice-engine.md`
- Prompt 01 backend-backed foundation remains in place:
  - H2 migration `V3__add_session_log_sync_and_timer_settings.sql`
  - REST endpoints:
    - `/api/settings/timer`
    - `/api/session-logs`
  - frontend hydration and sync through `TimerContext`
- Prompt 02 completed the screen-level core flow:
  - `src/pages/HomePage.tsx`
    - quick start waits for backend timer-settings hydration
    - calm loading and warning banners surface backend state
  - `src/pages/PracticePage.tsx`
    - start-session action waits for hydrated timer defaults
    - blocked guidance distinguishes backend loading from active playlist-run state
- Expanded app-level and page-level test coverage for the backend-backed practice engine:
  - `src/App.test.tsx`
    - Home quick-start hydration gating
    - backend timer-settings persistence across a fresh app mount
    - ended-early timer -> backend history -> History rehydration across a fresh app mount
  - `src/pages/HomePage.test.tsx`
  - `src/pages/PracticePage.test.tsx`
  - `src/pages/ActiveTimerPage.test.tsx`
- Updated milestone tracking docs:
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`
- Prompt 03 review artifacts:
  - created `docs/review-core-fullstack.md`
  - recorded critical, important, and nice-to-have findings
  - prepared prompt 04 as the exact next remediation slice
- Prompt 04 remediation:
  - added `requirements/execplan-milestone-a-core-remediation.md`
  - locked `Practice` timer-setting controls while backend timer settings hydrate
  - locked `Settings` defaults controls while backend timer settings hydrate
  - added explicit settings-sync state so Settings save feedback only reports success after backend persistence succeeds
  - updated focused tests for hydration locking and truthful Settings save feedback
- Prompt 05 verification:
  - added `requirements/execplan-milestone-a-core-testing.md`
  - added app-level coverage proving Home quick start can launch from backend-hydrated defaults
  - added backend repository coverage proving seeded timer settings round-trip through H2 persistence updates
  - re-ran the full frontend and backend verification suite successfully
  - completed isolated live runtime verification using:
    - temporary backend port `8081`
    - temporary frontend port `5175`
    - temporary H2 database `meditation-prompt05`
  - confirmed live:
    - backend health
    - timer settings GET/PUT persistence
    - `session log` GET/PUT persistence
    - frontend `/api` proxy reachability
    - hydrated Home and Practice launch surfaces against backend-backed defaults

## Milestone completion summary
- Completed the first backend-backed vertical slice for the calm core practice journey:
  - timer settings persistence
  - `session log` persistence
  - Home, Practice, active timer, History, and Settings integration
- Closed the important review findings before merge:
  - hydration overwrite risk on Practice and Settings
  - optimistic Settings success feedback that could contradict backend failures
- Finished with both automated and live verification strong enough for parent-branch merge.

## Intentional sample or helper content that remains
- Frontend persistence for sankalpas is still local-first outside the completed media catalog, `custom play`, and playlist seams.
- Built-in sample media metadata remains as a fallback when the backend media endpoint is unavailable.
- `docs/review-foundation-fullstack.md` remains as the review artifact for the completed foundation assessment.

## Verification status
- Passed `npm run typecheck`
- Passed `npm run lint`
- Passed `npm run test`
- Passed `npm run build`
- Passed `mvn -Dmaven.repo.local=../local-data/m2 test`
- Passed `mvn -Dmaven.repo.local=../local-data/m2 verify`
- Verified live local backend startup with `npm run dev:backend`
- Verified live local frontend startup with `npm run dev:frontend`
- Verified backend reachability with `curl -s http://localhost:8080/api/health`
- Verified backend media catalog directly with `curl -s http://localhost:8080/api/media/custom-plays`
- Verified frontend dev proxy reachability with `curl -s http://localhost:5173/api/media/custom-plays`
- Verified live UI hydration in the browser on:
  - `http://127.0.0.1:5173/`
  - `http://127.0.0.1:5173/practice`
- Re-ran prompt 04 focused remediation coverage for:
  - Practice hydration locking
  - Settings hydration locking
  - truthful backend-backed Settings save feedback
- Passed prompt 05 added coverage for:
  - Home quick start launching from backend-hydrated defaults
  - H2-backed timer settings repository persistence
- Verified isolated live backend startup on `http://127.0.0.1:8081/api/health`
- Verified isolated live backend timer settings on `http://127.0.0.1:8081/api/settings/timer`
- Verified isolated live backend `session log` history on `http://127.0.0.1:8081/api/session-logs`
- Verified isolated live frontend proxy reachability on:
  - `http://127.0.0.1:5175/api/media/custom-plays`
  - `http://127.0.0.1:5175/api/settings/timer`
  - `http://127.0.0.1:5175/api/session-logs`
- Verified isolated live Home and Practice hydration with headless Chrome on:
  - `http://127.0.0.1:5175/`
  - `http://127.0.0.1:5175/practice`

## Known limitations
- Sankalpas are still local-first in the UI.
- Media upload/import and authenticated admin/media-management flows are still unimplemented.
- Timer and playlist sound playback remain UI-only.
- The Flyway H2-version compatibility warning still appears in this environment, but tests and runtime verification passed.
- `Practice` still writes directly into shared saved timer settings; prompt 04 intentionally deferred that larger defaults-vs-session-draft model change as a later nice-to-have.
- `TimerContext` remains the main change-risk hotspot for future milestone work even after the targeted remediation.
- The default local dev H2 database file and default dev ports were already busy during prompt 05, so live verification used an isolated temporary backend/frontend runtime instead of mutating the busy default environment.

## Review findings summary
- Critical:
  - none recorded in `docs/review-core-fullstack.md`
- Important:
  - prompt 04 remediated both previously important issues
- Nice-to-have:
  - Practice currently mutates shared saved defaults immediately.
  - `TimerContext` is carrying too many responsibilities.
  - backend validation duplicates reference-domain values in code.

## Files updated in this slice
- `requirements/execplan-milestone-a-core-testing.md`
- `backend/src/test/java/com/meditation/backend/settings/TimerSettingsRepositoryTest.java`
- `src/App.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## Exact recommended next prompt
Read:
- AGENTS.md
- PLANS.md
- requirements/session-handoff.md
- requirements/decisions.md

Then:

1. Inspect the current git branch and confirm the current branch name before making changes.
2. Treat the current branch as the parent branch for this Milestone C.
3. Create a new local branch for this Milestone C work from the current branch.
4. Use a clear branch name in this format if available:
   - `codex/milestone-c-discipline-insight-fullstack`
   If that exact name already exists locally, create a clear alternative with a short numeric suffix.
5. Switch to the new branch.
6. Confirm:
   - parent branch name
   - new branch name
   - that the working tree is ready for the milestone work
7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
8. In session-handoff, record:
   - parent branch
   - milestone branch
   - milestone scope
   - exact recommended next prompt
9. Do not implement milestone feature work in this step beyond branch setup and minimal documentation updates if needed.
10. Commit documentation-only changes if any were made, with a clear message such as:
   chore(branch): prepare local branch for Milestone C
