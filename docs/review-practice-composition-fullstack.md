# Review: Practice Composition Full-Stack

## Scope reviewed
- UX and usability across manual logging, media-backed `custom play`, and playlist full-stack work
- media setup clarity
- code quality and maintainability
- REST design and backend hygiene
- performance and change-risk hotspots

## Critical
- None.

## Important
- Playlist delete failures are surfaced with the wrong user message. `deletePlaylist` collapses backend failures into `{ deleted: false }` in [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L1156), and `confirmDelete` in [src/features/playlists/PlaylistManager.tsx](/Users/prashantwani/wrk/meditation/src/features/playlists/PlaylistManager.tsx#L120) always translates that into “This playlist is currently running.” If the backend is unreachable or returns a server-side error, the user gets a misleading active-run explanation instead of truthful guidance about the failed delete.
- Playlist runs can still start from stale cached definitions before backend hydration finishes. The run button stays enabled whenever only `isPlaylistsLoading` is true in [src/features/playlists/PlaylistManager.tsx](/Users/prashantwani/wrk/meditation/src/features/playlists/PlaylistManager.tsx#L352), and `startPlaylistRun` uses whatever playlist list is currently in memory in [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L1209). Because prompt 03 moved playlist definitions to H2 as the source of truth, this can launch a run with old order or duration data from the browser cache and produce incorrect playlist `session log` entries.
- Playlist item ids can still fail with an unhandled server error across playlists. The migration adds a global unique index on `playlist_item.external_id` in [backend/src/main/resources/db/migration/V5__add_playlist_rest_support.sql](/Users/prashantwani/wrk/meditation/backend/src/main/resources/db/migration/V5__add_playlist_rest_support.sql#L10), but `PlaylistService` only validates uniqueness within a single request payload in [backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java#L131). If migrated local data or future imports reuse an item id in a different playlist, the API will fall through to a database constraint failure instead of returning a clean validation response.

## Nice-to-have
- `TimerContext` is still accumulating too many responsibilities. After prompt 03 it now hydrates and syncs settings, `session log`, `custom play`, playlist, and active-run state in one provider in [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx). The current code is still workable, but the milestone is increasing the blast radius of each future change; extracting feature-specific sync helpers would lower review and regression risk in later milestones.
