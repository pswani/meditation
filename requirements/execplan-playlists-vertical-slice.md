# ExecPlan: Playlists Vertical Slice

## 1. Objective
Implement `playlist` management and run flow as a complete vertical slice, including `history` integration via defined playlist session log behavior.

## 2. Why
Playlists are a core roadmap capability for structured practice sequences. This slice delivers reusable ordered flows plus logging trust so users can run multi-part sessions and review outcomes in `history`.

## 3. Scope
Included:
- Playlist CRUD:
  - create
  - edit
  - delete
  - favorite
- Ordered playlist items with explicit move up/down controls
- Derived total duration computation
- Lightweight playlist run flow:
  - start run
  - auto-advance between playlist items
  - pause/resume
  - end early with confirmation
  - completion state
- Playlist session log behavior definition and implementation
- History integration for playlist-generated session logs
- Local-only persistence for playlists
- Focused validation/logging tests

Excluded:
- backend/cloud sync
- notifications
- audio playback sequencing
- summaries/sankalpa features
- broad shell/nav refactor

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/07-playlists.md

## 5. Affected files and modules
- `src/types/playlist.ts`
- `src/utils/playlist.ts`
- `src/utils/playlistLog.ts`
- `src/utils/storage.ts`
- `src/features/timer/*` (shared state/context integration)
- `src/features/playlists/PlaylistManager.tsx`
- `src/pages/PlaylistsPage.tsx`
- `src/pages/PlaylistRunPage.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/index.css`
- focused playlist tests
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Users can create/edit ordered playlist items with required meditation type and duration.
- Users can reorder playlist items and see derived total duration.
- Playlist runs progress item-by-item with timer feedback and pause/resume.
- Ending early requires explicit confirmation.
- Playlist run completion/ended-early state is visible and actionable.
- History includes playlist-generated session logs with playlist metadata context.

## 7. Data and state model
- Add playlist domain model and draft validation helpers.
- Persist playlists in localStorage.
- Keep timer and playlist run state in shared local context.
- Define playlist session log rule:
  - create one `session log` per playlist item reached during run
  - completed items log as `completed`
  - ended-early current item logs as `ended early` with actual completed duration
  - future unstarted items do not log
  - each playlist-derived entry carries playlist metadata (name/id/item position/count)

## 8. Risks
- State complexity when running playlist timing alongside existing timer state.
- Potential accidental overlap between timer session and playlist run.
- Responsive density risk in playlist item builder on small screens.

## 9. Milestones
1. Add playlist domain types and pure utilities (validation/order/total/log builder).
2. Extend storage and shared context for playlists and playlist run state.
3. Build playlist management UI and route-level screens.
4. Integrate playlist log metadata into history display.
5. Add focused tests for playlist validation and logging rules.
6. Run verification and update documentation.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create/edit/delete/favorite playlists
  - reorder items and verify total duration
  - run playlist through completion and ended-early paths
  - verify playlist logs appear in history with metadata context

## 11. Decision log
- Keep playlist logs as `auto log` entries with explicit playlist metadata fields.
- Log at playlist-item granularity for clear meditation-type attribution and accurate partial-run handling.
- Use local-only persistence and route-level playlist run screen for calm, bounded prototype scope.

## 12. Progress log
- Completed: prompt/docs review and implementation planning.
- Completed: playlist types, validation helpers, order helpers, and playlist log builder.
- Completed: playlist state, persistence, and run-flow engine in shared context.
- Completed: playlist management screen and active run screen.
- Completed: history integration for playlist session logs.
- Completed: focused tests for playlist validation and logging rules.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: decisions and session handoff updates.
