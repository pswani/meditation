# ExecPlan: UX Refinement for Playlists + Related History

## 1. Objective
Implement the critical and important UX improvements from `docs/ux-review-playlists.md` across playlist creation/run behavior and playlist-related `history` readability.

## 2. Why
The playlists slice is functionally solid but has trust gaps (active-run replacement and active-playlist deletion), plus clarity gaps (silent blocked start, fragmented run context in history). Fixing these improves confidence and calm usability without broad refactors.

## 3. Scope
Included:
- Prevent starting a new playlist run when one is already active
- Prevent deleting the currently active playlist
- Show explicit in-context feedback when `Run Playlist` is blocked
- Add run-level context cues in `history` for playlist item logs
- Add `Up next` context in active playlist run
- Reduce ordering-control density on smaller screens
- Add focused tests for updated run policy and log metadata

Excluded:
- custom plays
- summaries
- sankalpa flows
- backend/cloud sync
- notifications/audio playback work
- unrelated navigation or architecture refactors

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-playlists.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/09-fix-ux-playlists.md

## 5. Affected files and modules
- `src/types/playlist.ts`
- `src/types/sessionLog.ts`
- `src/utils/playlistLog.ts`
- `src/utils/playlistRunPolicy.ts`
- `src/features/timer/timerContextObject.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/playlists/PlaylistManager.tsx`
- `src/pages/PlaylistRunPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/index.css`
- `src/utils/playlistRunPolicy.test.ts`
- `src/utils/playlistLog.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Starting a second playlist run while one is active is blocked with clear feedback.
- Deleting a playlist that is currently running is blocked and visually disabled.
- Run-start blocking due to active timer session is explicitly explained in-place.
- Playlist run screen shows current item plus `Up next` when applicable.
- `history` shows lightweight run-level context for playlist-generated entries.
- Playlist item ordering actions remain touch-friendly while reducing phone clutter.

## 7. Data and state model
- Keep local-only persistence.
- Add run metadata to playlist-generated `session log` entries:
  - `playlistRunId`
  - `playlistRunStartedAt`
- Keep timer session and playlist run mutually exclusive.
- Return structured playlist run start results with explicit block reasons.

## 8. Risks
- Over-coupling run policy with UI behavior if logic is not centralized.
- Mis-grouping history entries if run metadata is missing in older logs.
- Making controls too minimal and hurting discoverability on phones.

## 9. Milestones
1. Add run/deletion policy helpers and wire guarded context behavior.
2. Update playlist management UX for blocked start feedback and safe delete behavior.
3. Add run-level history context and `Up next` run-screen clarity.
4. Refine responsive control density for playlist item ordering.
5. Add focused tests for policy and playlist log metadata.
6. Run full verification and update decisions/session handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - active run cannot be silently replaced
  - active playlist cannot be deleted
  - blocked run attempt shows reason
  - active run shows `Up next` context
  - playlist run entries in history show run-level context

## 11. Decision log
- Prefer hard-block behavior (not confirmation replace) for active-run replacement to maximize trust and reduce accidental interruption.
- Add run metadata to logs for low-cost, high-value readability improvements in history.
- Keep UX refinements bounded to playlists and related history only.

## 12. Progress log
- Completed: source-doc and prompt review.
- Completed: added run/deletion policy helpers and wired guarded context behavior.
- Completed: added blocked run-start feedback and active-playlist delete guard UX in playlist management.
- Completed: added `Up next` context in active playlist run screen.
- Completed: added run-level playlist context cues in history.
- Completed: reduced phone ordering-control density with compact controls.
- Completed: added focused tests for:
  - playlist run/delete policy
  - playlist log metadata including run fields
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: updated decisions and session handoff documents.
