# Practice Composition Review

## Scope reviewed
- `Practice` timer setup and active timer journey
- `History` manual log flow and session-log readability
- `Custom Plays` create/edit/delete/favorite/apply flow
- `Playlists` create/run/end-early flow and history touchpoints
- navigation and responsive behavior across phone, tablet, and desktop

## Review lens
- calmness and low-friction interaction
- end-to-end reliability
- data integrity and trustworthiness
- responsive usability and navigation clarity

## Summary
Milestone B is functionally complete and coherent: manual logging, custom plays, playlist management, and playlist run logging all work together. The main remaining risk is reliability across interruptions (reload/close), followed by a few usability/data-boundary gaps that can reduce trust as usage grows.

## Findings

### Critical
1. Active timer and active playlist run state are not resilient to reload/refresh interruptions.
- Evidence:
  - timer state is initialized from stored settings/logs only, while active runtime state starts in-memory (`src/features/timer/TimerContext.tsx:24-35`)
  - persistence effects save settings/logs/custom plays/playlists, but no active session/run snapshot is persisted (`src/features/timer/TimerContext.tsx:49-63`)
- Impact:
  - if the app reloads mid-session or mid-playlist-run, the in-progress state is lost
  - users can lose continuity and expected session-log outcomes, which weakens trust in practice tracking
- Recommendation:
  - persist active timer/playlist run snapshots and rehydrate safely on app start
  - include a recovery banner that explains resumed or abandoned in-progress state

### Important
1. `Start Session` can fail without explicit user feedback when a playlist run is already active.
- Evidence:
  - `startSession` hard-blocks while `activePlaylistRun` exists (`src/features/timer/TimerContext.tsx:379-382`)
  - `Practice` start handler only navigates on success and does not surface failure reason (`src/pages/PracticePage.tsx:75-81`)
- Impact:
  - users can tap `Start Session` and see no immediate explanation
  - this feels like a broken action during a valid app state
- Recommendation:
  - disable `Start Session` while a playlist run is active and show clear inline guidance to resume/end the run

2. History is limited to recent entries and lacks filters promised by screen inventory.
- Evidence:
  - context exposes only `recentLogs` via `.slice(0, 20)` (`src/features/timer/TimerContext.tsx:168`)
  - `History` renders this subset only and includes no filters (`src/pages/HistoryPage.tsx:39-121`)
  - screen inventory expects history `filters` (`docs/screen-inventory.md:29-32`)
- Impact:
  - playlist item logs can quickly push older manual/auto entries out of view
  - users cannot narrow by source/status when scanning mixed logs
- Recommendation:
  - add lightweight filters (at least source and status) and a clear `show more` pattern

3. Session-log load validation is structurally permissive and can admit semantically invalid data.
- Evidence:
  - `isSessionLog` accepts any string meditation type and only type-checks numeric fields, without date/value sanity checks (`src/utils/storage.ts:39-69`)
- Impact:
  - malformed storage data can pollute history and downstream summary/sankalpa computations
  - trust in totals can degrade after corrupted local data
- Recommendation:
  - strengthen normalization to validate meditation type enum, timestamp parseability, and non-negative/consistent durations before admitting entries

### Nice to have
1. Playlist create/update lacks explicit success confirmation.
- Evidence:
  - on successful submit, form resets but no success status is shown (`src/features/playlists/PlaylistManager.tsx:38-47`)
- Recommendation:
  - add calm inline confirmation (`Playlist saved`) similar to manual log/custom play flows

2. Playlist management discoverability is still secondary for frequent playlist users.
- Evidence:
  - primary nav includes only top-level routes (`src/app/routes.ts:10-16`)
  - playlists route exists but is accessed via `Practice` tools and a secondary `Open Playlists` action (`src/App.tsx:21-22`, `src/pages/PracticePage.tsx:245-260`)
- Recommendation:
  - keep current IA, but add a stronger fast-path (for example, visible shortcut in `Practice` header when playlists exist)

3. History could better communicate that it is a recent-window view.
- Evidence:
  - heading says `Recent Session Logs`, but there is no count or explicit retention hint despite hard limits (`src/pages/HistoryPage.tsx:70`, `src/features/timer/timerReducer.ts:13`)
- Recommendation:
  - show lightweight context such as `Showing 20 most recent of 50 stored logs`
