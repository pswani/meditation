# Current State

This file tracks the durable repository state rather than a prompt-by-prompt history.

## Repository status
- Current branch: `main`
- Active bundle: none
- Latest completed bundle: `ios-safari-ux-hardening-feature-bundle-with-branching`
- Latest merge outcome: merged `fix/ios-safari-ux-hardening` back into `main` on 2026-04-03 with a normal local merge commit

## Product state
- The repo is a working full-stack meditation application with:
  - a React + TypeScript + Vite frontend
  - a Spring Boot backend in `backend/`
  - H2 persistence plus Flyway migrations
  - local-first queue-backed behavior for the implemented backend-backed domains
- Implemented vertical slices now include:
  - timer setup, active runtime, sounds, and session logging
  - dedicated prerecorded `custom play` runtime with persisted recovery
  - playlist runtime with linked `custom play` audio, optional small gaps, and per-item logging
  - summary views with backend-backed and local fallback behavior
  - sankalpa create, edit, and archive flows with backend-backed archived-state persistence
- Timer lock-screen mitigation now includes:
  - foreground catch-up sync on `visibilitychange` and `pageshow` so fixed sessions finalize immediately after Safari returns
  - coalesced foreground catch-up so overlapping `visibilitychange` and `pageshow` events do not trigger duplicate completion handling
  - targeted fixed-session guidance that only appears in likely iPhone Safari browser contexts
  - deferred-completion messaging after foreground catch-up finalizes a fixed session
  - optional Settings notification UX that shows capability and permission state and provides an explicit permission request action when supported
  - completion notification attempts only when Notification permission is granted and the document is hidden
- Sankalpa behavior now includes:
  - editing existing goals while preserving `id` and `createdAt`
  - recalculating progress from edited goal fields against the original goal window
  - archiving active, completed, or expired goals into a dedicated archived section
  - aligned frontend, storage, and backend handling for `active`, `completed`, `expired`, and `archived` states

## Evidence and artifacts
- Implementation planning: `docs/execplan-ios-safari-ux-hardening-feature.md`
- Implementation planning: `docs/execplan-sankalpa-edit-archive-feature.md`
- Review artifact: `docs/review-ios-safari-ux-hardening.md`
- Review artifact: `docs/review-sankalpa-edit-archive-feature.md`
- Review artifact: `docs/review-ios-lock-screen-end-bell-mitigation.md`
- Review artifact: `docs/review-ios-safari-ux-issues.md`
- Verification report: `docs/test-ios-safari-ux-hardening.md`
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
- Sankalpa edit/archive verification completed on 2026-04-02:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 41 files and 271 tests
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` with 40 backend tests
- Review outcome:
  - no blocker, high, or medium findings were recorded for the sankalpa edit/archive slice

- iOS lock-screen end-bell bundle verification executed on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 41 files and 271 tests
  - `npm run build`
  - `npm run test -- src/features/timer/timerSoundPlayback.test.tsx src/features/timer/TimerContext.test.tsx`
- iOS lock-screen end-bell mitigation implementation verified on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 42 files and 277 tests
  - `npm run build`
- iOS Safari UX hardening implementation verified on 2026-04-03:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` with 44 files and 293 tests
  - `npm run build`
- Review outcome:
  - no blocker, high, or medium findings were recorded for the iOS Safari UX hardening slice

## Remaining known gaps
- `sankalpa` delete and unarchive flows are still unimplemented.
- There is still no broader user-managed media library beyond the seeded catalog and filesystem conventions.
- Browser-automation coverage for goals-screen responsive/archive-confirmation behavior is still absent; current confidence comes from unit, component, and backend tests.
- The frontend production build still emits the pre-existing large-chunk warning.

## Recommended next slice
- Exact recommended next prompt: none currently recorded after `ios-safari-ux-hardening-feature-bundle-with-branching`; choose the next bounded slice from the roadmap after product reprioritization.
