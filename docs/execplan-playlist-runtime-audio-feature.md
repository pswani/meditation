# ExecPlan: Playlist Runtime Audio Feature

## 1. Objective
Implement playlist runtime audio end to end by letting playlist items optionally run linked `custom play` recordings, adding optional small gaps between items, and keeping playlist logging, persistence, and responsive UX trustworthy.

## 2. Why
Playlists currently sequence timed metadata only. This leaves a product gap between the existing `custom play` runtime and the intended playlist experience, and it keeps one of the last release-candidate gaps open in the roadmap.

## 3. Scope
Included:
- playlist item support for optional linked `custom play` runtime audio
- playlist-level optional small gaps between items
- active playlist runtime support for timed items, audio-backed items, and gap phases
- playlist logging updates needed for trustworthy per-item history
- focused frontend and backend contract updates needed by the new playlist shape
- focused tests and documentation updates for this slice

Excluded:
- broader media upload or catalog work
- unrelated timer refactors
- unrelated summary or `sankalpa` changes
- new navigation structure

## 4. Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/playlist-runtime-audio-feature-bundle-with-branching/01-implement-playlist-runtime-audio.md`

## 5. Affected Files And Modules
- `src/types/playlist.ts`
- `src/utils/playlist.ts`
- `src/utils/playlistApi.ts`
- `src/utils/playlistLog.ts`
- `src/utils/storage.ts`
- `src/features/playlists/PlaylistManager.tsx`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/app/AppShell.tsx`
- `src/pages/PlaylistRunPage.tsx`
- frontend tests around playlists, storage, runtime, and app flows
- backend playlist REST request/response/service classes and tests

## 6. UX Behavior
- A playlist item can remain a simple timed segment or link to an existing `custom play`.
- Linked `custom play` items should clearly communicate that the runtime uses the recording and timing from the selected `custom play`.
- Playlist editing stays calm and single-column on narrow screens.
- Playlist runs should clearly show the current item, current phase, remaining time, and what is coming next.
- Optional small gaps should be explicit but unobtrusive.
- If a linked runtime recording cannot be resolved safely before launch, starting the playlist should fail with clear guidance instead of silently pretending audio exists.

## 7. Data And State Model
- Extend `Playlist` with `smallGapSeconds`.
- Extend `PlaylistItem` with a stable display title and optional linked `customPlayId`.
- Resolve linked `custom play` items into runtime-ready playlist items at launch time so active-run recovery can keep using the resolved media metadata even after route changes or reloads.
- Represent playlist runtime phases explicitly so timed items, audio-backed items, and gap phases can share one trustworthy active-run model.

## 8. Risks
- `TimerContext` is already dense, so new runtime logic should be extracted into helpers where it materially reduces risk.
- Audio-backed playlist items depend on current `custom play` and media metadata, so start-time validation must be explicit.
- Existing playlists stored without the new fields must keep loading safely with sensible defaults.
- Backend and frontend contracts must stay in sync because playlists are already backend-backed and queue-replayed.

## 9. Milestones
1. Extend playlist domain types, helpers, storage normalization, and REST contracts.
2. Update playlist management UI to support optional small gaps and optional linked `custom play` items.
3. Implement playlist runtime state for timed items, gap phases, and audio-backed items.
4. Wire the shell audio element for active playlist audio playback and update the run screen UX.
5. Add focused frontend and backend tests, then update durable docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## 11. Decision Log
- Chosen approach: reuse existing `custom play` media/runtime capabilities for playlist audio instead of inventing a second media source.
- Chosen approach: use the already-present backend `small_gap_seconds` column instead of adding a new persistence shape.

## 12. Progress Log
- 2026-04-02: Reviewed the bundle prompts, current playlist runtime code, and backend playlist schema/REST model.
- 2026-04-02: Chosen implementation direction is mixed playlist items with optional linked `custom play` audio plus playlist-level small gaps.
