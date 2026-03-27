# ExecPlan: Milestone B Playlists Full-Stack Support

## 1. Objective
Implement the third Milestone B slice by moving playlist persistence from browser-local storage to backend-backed H2 + REST, while preserving the current calm playlist management and playlist-run UX.

## 2. Why
Playlists are a core practice-composition feature, but right now they only persist in the browser. Moving playlists and playlist items into the backend makes cross-reload behavior more trustworthy, aligns playlist history with H2-backed `session log` persistence, and closes another major local-only seam in the Milestone B scope.

## 3. Scope
Included:
- backend playlist and playlist-item persistence using the existing H2 tables
- any H2 migration needed to support the current frontend playlist item identifiers and clean history behavior
- backend REST endpoints for playlist list, upsert, and delete
- frontend playlist API-boundary helpers for list, upsert, and delete
- frontend playlist hydration, migration from older local data, and truthful async save/delete/favorite feedback
- explicit playlist logging behavior that preserves readable History context even if a playlist is later deleted
- focused backend and frontend tests
- docs, decisions, and session handoff updates

Excluded:
- sankalpa REST persistence
- audio playback
- optional playlist item gaps or custom-play-backed playlist items
- broad `TimerContext` decomposition
- unrelated design changes outside playlist management and playlist-run trust

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/milestone-b-practice-composition-fullstack/03-playlists-rest.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-b-playlists-rest.md`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/java/com/meditation/backend/playlist/**`
- `backend/src/main/java/com/meditation/backend/sessionlog/**`
- `backend/src/test/java/com/meditation/backend/playlist/**`
- `src/types/playlist.ts`
- `src/utils/playlist.ts`
- `src/utils/playlistApi.ts`
- `src/utils/playlistApi.test.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts`
- `src/features/playlists/PlaylistManager.tsx`
- `src/features/playlists/PlaylistManager.test.tsx`
- `src/pages/PlaylistsPage.test.tsx`
- `src/pages/PlaylistRunPage.test.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Playlist management remains on the existing playlist screen and keeps the current responsive form/list structure.
- Playlist list hydration should come from the backend, with older local playlists promoted forward on first load when possible.
- Playlist save, update, favorite, and delete actions should reflect backend persistence truthfully.
- Playlist management surfaces should show calm load/sync feedback:
  - loading playlists from the backend
  - saving or deleting playlists
  - inline warning when backend load/save/delete fails
- Playlist run behavior remains per-item and distraction-free:
  - each reached playlist item creates an `auto log`
  - completed items log with status `completed`
  - ending early logs the active item with status `ended early` and actual completed duration
  - unstarted future items do not log
- History should keep readable playlist context even if the playlist record is later deleted.

## 7. Data and state model
- Backend:
  - reuse `playlist` and `playlist_item` tables
  - add an external string identifier for playlist items so existing frontend item ids can survive migration cleanly
  - expose:
    - `GET /api/playlists`
    - `PUT /api/playlists/{id}`
    - `DELETE /api/playlists/{id}`
  - persist playlist items in request order and validate required fields
  - preserve playlist-generated `session log` context through stored snapshot fields (`playlistName`, run metadata, item position/count)
  - allow playlist deletion without corrupting historical `session log` rows by keeping playlist history context independent of a live playlist row
- Frontend:
  - keep the existing `Playlist` and `PlaylistItem` screen contract stable
  - hydrate playlists from the backend on provider mount
  - preserve local storage as migration source and fallback cache
  - move playlist CRUD/favorite actions through the new API boundary
  - keep active playlist-run state local-first for recovery, while playlist definitions come from backend hydration

## 8. Risks
- The current `playlist_item` schema uses an internal numeric id, but the frontend already relies on stable string item ids.
- Playlist delete behavior can conflict with historical `session log` foreign-key integrity if history and live playlist rows are coupled too tightly.
- Async playlist persistence can create misleading form feedback if the current synchronous UI flow is not updated carefully.
- `TimerContext` already coordinates timer, custom play, playlist, settings, and history behavior, so this integration must stay deliberately incremental.

## 9. Milestones
1. Add the ExecPlan and inspect current playlist frontend/backend/session-log seams.
2. Add backend schema/domain/controller support for playlist and playlist-item persistence.
3. Add frontend playlist REST helpers and provider hydration/persistence integration.
4. Update playlist management UX feedback and preserve clean playlist-run logging behavior.
5. Add focused backend/frontend tests.
6. Run full verification, update docs/handoff, and commit the slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Keep the existing frontend `Playlist` contract stable and adapt backend DTOs to it instead of rewriting playlist screens.
- Reuse the existing playlist tables, but add a stable external playlist-item id so browser-created playlists can migrate without losing item identity.
- Keep playlist-generated `session log` history readable through snapshot metadata (`playlistName`, item position/count, run identifiers) rather than coupling History rendering to a still-live playlist row.

## 12. Progress log
- 2026-03-26: reviewed the milestone prompt, playlist product/UX docs, the current frontend playlist model and UI, the local-storage playlist API seam, the playlist-run logging path in `TimerContext`, and the existing backend playlist/session-log schema.
- 2026-03-26: implemented backend playlist and playlist-item persistence with H2 migration `V5__add_playlist_rest_support.sql`, playlist controller/service/repository support, and playlist-history-safe delete behavior.
- 2026-03-26: added frontend playlist REST helpers, backend hydration plus local-cache migration in `TimerContext`, and truthful async playlist save/delete/favorite feedback in `PlaylistManager`.
- 2026-03-26: completed prompt verification with:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
