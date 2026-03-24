# UX Review: Playlists Vertical Slice

## Scope reviewed
- `Playlists` management screen (`/practice/playlists`)
- `Playlist Run` active flow (`/practice/playlists/active`)
- Playlist entry affordances from `Practice`
- Playlist-generated `history` integration
- responsive behavior across mobile, tablet, and desktop

## Review lens
- clarity
- calmness
- low friction
- ordering complexity
- logging comprehension
- responsive usability

## Summary
The playlists slice is a strong functional prototype with clear core capabilities (CRUD, ordering, run flow, and history integration). The largest UX risks are around run-safety and trust: users can unintentionally replace an active run, and active playlists can be deleted during a run with no guardrail. Secondary issues involve logging comprehension and dense control layout on smaller screens.

## Findings

### Critical
1. Active playlist run can be replaced silently by starting another playlist.
- Friction/risk:
  - Starting a new playlist while one is already active immediately swaps run state with no warning.
  - In-progress run context can be lost without explicit confirmation or explicit `ended early` logging for the abandoned run.
- Recommendation:
  - Block starting a second run while one is active, or require confirmation with explicit outcomes:
    - `Continue current run`
    - `End current run and start new playlist`

2. Active playlist can be deleted while run is in progress.
- Friction/risk:
  - `Delete` remains available on the playlist card even when it is currently running.
  - This weakens user trust and introduces conceptual inconsistency between active run state and source playlist management.
- Recommendation:
  - Disable delete for the actively running playlist, or require a stronger warning that includes active-run implications.

### Important
1. `Run Playlist` failure states are silent when timer session is already active.
- Friction:
  - `startPlaylistRun` returns `false` if timer session exists, but UI does not explain why run did not start.
- Recommendation:
  - Show inline feedback near controls (for example: `Finish or end the active timer session before starting a playlist run`).

2. Playlist logging is technically correct but cognitively fragmented in history.
- Friction:
  - Per-item logs appear as independent entries and are not visually grouped by run instance.
  - Users may misread a single playlist run as unrelated separate sessions.
- Recommendation:
  - Add lightweight visual grouping by playlist run cluster (same playlist name + close timestamps), or add a `Run started at` context line.

3. Ordering controls are dense on phone for larger item counts.
- Friction:
  - `Move Up`, `Move Down`, and `Remove` on every row create repetitive control density and vertical sprawl.
- Recommendation:
  - Keep touch targets but reduce clutter with compact icon/text controls or progressive row-level action reveal.

4. Playlist run screen lacks explicit “up next” context.
- Friction:
  - Current item status is clear, but users cannot quickly see what meditation type comes next.
- Recommendation:
  - Add a calm `Up next` line when there is a next item.

### Nice to have
1. Add quick actions for playlist item duplication to speed playlist drafting.
2. Add optional favorite-first sorting toggle for playlist list scanability.
3. Add lightweight timestamp summary on completion card (`Started`, `Ended`) for stronger run closure.

## Prioritized UX improvement list

### Critical
1. Prevent silent active-run replacement when starting another playlist.
2. Prevent or strongly guard deletion of currently active playlist.

### Important
1. Add clear feedback for blocked `Run Playlist` attempts during active timer session.
2. Improve history readability for per-item playlist logs via run-level grouping context.
3. Reduce ordering-control density on phone layouts.
4. Add `Up next` context in active playlist run.

### Nice to have
1. Add item duplication shortcut.
2. Add favorite-first playlist sorting option.
3. Add richer completion timestamp context.
