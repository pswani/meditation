# Playlist Runtime Audio Review

## Findings

1. High: recording-backed playlist runs recover from wall-clock time instead of persisted playback progress. In [`src/features/timer/TimerContext.tsx:195`](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L195), `recoverActivePlaylistRun` recomputes the remaining time from `currentSegment.endAtMs`. But audio-backed items never refresh `endAtMs` when playback progress changes; [`src/utils/playlistRuntime.ts:242`](/Users/prashantwani/wrk/meditation/src/utils/playlistRuntime.ts#L242) only updates `elapsedSeconds` and `remainingSeconds`. After a reload or long background pause, a recording-backed item can jump forward, log too much completed time, or be cleared entirely even though the saved playback position was much earlier.

2. Medium: the playlist API now accepts arbitrary `customPlayId` values without referential validation, which lets the backend persist playlists that the runtime cannot start. [`backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java:77`](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java#L77) writes `customPlayId` directly after trimming it, and [`backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java:146`](/Users/prashantwani/wrk/meditation/backend/src/main/java/com/meditation/backend/playlist/PlaylistService.java#L146) only checks for blank strings. A stale offline queue entry or any direct API client can therefore save a playlist whose linked item will fail only at launch time with `playlist item unavailable`.

## Open Questions Or Assumptions

- This review assumes recording-backed playlist items are expected to resume truthfully from the persisted playback position after a reload, because the new slice explicitly advertises active-run recovery across route changes and reloads.
- I did not find focused regression coverage for recording-backed playlist recovery or for backend rejection of dangling `customPlayId` references; the next verification step should cover both.
