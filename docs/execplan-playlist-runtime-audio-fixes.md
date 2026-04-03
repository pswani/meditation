# ExecPlan: Playlist Runtime Audio Findings Fixes

## Objective
Fix the two important findings from review and test for playlist runtime audio without widening the slice.

## Findings In Scope
- recording-backed playlist recovery should resume from the persisted playback position, not from stale wall-clock timing
- playlist saves should reject dangling `customPlayId` references at the backend boundary

## Planned Changes
1. Update playlist-run recovery so audio-backed items rebuild their segment from stored playback progress during hydration.
2. Add frontend regression coverage for audio-backed playlist recovery.
3. Inject backend `custom play` lookup validation into playlist saves.
4. Add backend API coverage that proves invalid linked `customPlayId` values are rejected.
5. Rerun the full frontend and backend verification commands.

## Explicit Exclusions
- broader `TimerContext` refactoring
- browser-automation playback work
- media-library product expansion
