# Current State

This file tracks the durable repository state rather than a prompt-by-prompt history.

## Repository status
- Current branch: `main`
- Active bundle: none
- Latest completed bundles in `prompts/`: cleaned up on 2026-04-04 after implementation completion
- Latest merge outcome: merged `feat/sankalpa-delete-unarchive` back into `pending-wrk` on 2026-04-03 with a normal local merge commit

## Product state
- The repo is a working full-stack meditation application with:
  - a React + TypeScript + Vite frontend
  - a Spring Boot backend in `backend/`
  - H2 persistence plus Flyway migrations
  - local-first queue-backed behavior for the implemented backend-backed domains
  - a unified shell pipeline wrapper at `./scripts/pipeline.sh` that provides operator-facing `verify`, `build`, `package`, and `release` stages over the existing production scripts
- Implemented vertical slices now include:
  - timer setup, active runtime, sounds, and session logging
  - dedicated prerecorded `custom play` runtime with persisted recovery
  - managed custom-play media library foundations with backend metadata, frontend fallback metadata, and clearer Practice-screen selection states
  - playlist runtime with linked `custom play` audio, optional small gaps, and per-item logging
  - summary views with backend-backed and local fallback behavior
  - sankalpa create, edit, archive, unarchive, and archived-only delete flows with backend-backed archived-state persistence and stale-delete recovery
- Timer lock-screen mitigation now includes:
  - foreground catch-up sync on `visibilitychange` and `pageshow` so fixed sessions finalize immediately after Safari returns
  - coalesced foreground catch-up so overlapping `visibilitychange` and `pageshow` events do not trigger duplicate completion handling
  - targeted fixed-session guidance that only appears in likely iPhone Safari browser contexts
  - deferred-completion messaging after foreground catch-up finalizes a fixed session
  - optional Settings notification UX that shows capability and permission state and provides an explicit permission request action when supported
  - completion notification attempts only when Notification permission is granted and the document is hidden
- Safari real-device release-trust work now includes:
  - a reusable iPhone Safari browser-tab QA checklist under `docs/`
  - a dedicated QA report artifact that can record current manual execution results or explicit environment limitations

## Evidence and artifacts
- Implementation planning: `docs/execplan-custom-play-media-library-feature.md`
- Implementation planning: `docs/execplan-ios-safari-ux-hardening-feature.md`
- Implementation planning: `docs/execplan-sankalpa-edit-archive-feature.md`
- Implementation planning: `docs/execplan-sankalpa-delete-unarchive-feature.md`
- Review artifact: `docs/review-custom-play-media-library.md`
- Review artifact: `docs/review-ios-safari-real-device-qa.md`
- Review artifact: `docs/review-ios-safari-ux-hardening.md`
- Review artifact: `docs/review-sankalpa-delete-unarchive-feature.md`
- Review artifact: `docs/review-sankalpa-edit-archive-feature.md`
- Review artifact: `docs/review-ios-lock-screen-end-bell-mitigation.md`
- Review artifact: `docs/review-ios-safari-ux-issues.md`
- Verification report: `docs/test-custom-play-media-library.md`
- Verification report: `docs/test-ios-safari-real-device-qa.md`
- Verification report: `docs/test-ios-safari-ux-hardening.md`
- Verification report: `docs/test-sankalpa-delete-unarchive-feature.md`
- Verification planning: `docs/ios-safari-real-device-qa-checklist.md`
- Verification planning: `docs/execplan-sankalpa-edit-archive-test.md`
- Verification report: `docs/test-sankalpa-edit-archive-feature.md`
- Verification report: `docs/test-ios-lock-screen-end-bell-fix-feature.md`
- Verification report: `docs/test-ios-lock-screen-end-bell-mitigation.md`

## Verification baseline
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## Latest verification
- Sankalpa delete/unarchive implementation verified on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 44 files and 301 tests
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` with 43 backend tests
- Review outcome:
  - no blocker, high, or medium findings were recorded for the sankalpa delete/unarchive slice

- Custom-play media library foundation verified on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 44 files and 295 tests
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` with 40 backend tests
- Review outcome:
  - no blocker, high, or medium findings were recorded for the custom-play media library slice

- iOS Safari real-device QA artifact verification recorded on 2026-04-03:
  - checklist artifact created at `docs/ios-safari-real-device-qa-checklist.md`
  - QA result report created at `docs/test-ios-safari-real-device-qa.md`
  - real-device execution status currently `warn` because no physical iPhone Safari device is available in this Codex environment
- Review outcome:
  - no blocker, high, or medium findings were recorded for the iOS Safari real-device QA bundle

- iOS Safari UX hardening implementation verified on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 44 files and 293 tests
  - `npm run build`
- Review outcome:
  - no blocker, high, or medium findings were recorded for the iOS Safari UX hardening slice

## Remaining known gaps
- Custom-play media registration is still script-driven; there is still no browser upload/import workflow.
- Real-device execution of the new iPhone Safari QA checklist is still pending on actual hardware.
- Browser-automation coverage for goals-screen responsive archive/delete confirmation behavior is still absent; current confidence comes from unit, component, and backend tests.
- The frontend production build still emits the pre-existing large-chunk warning.

## Recommended next slice
- Exact recommended next prompt: `main-upstream-publish-bundle`
