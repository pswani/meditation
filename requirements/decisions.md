# Decisions

## Decision log

### Initial decisions
- Use React + TypeScript + Vite for the front-end.
- Keep V1 local-first.
- Avoid unnecessary dependencies.
- Use responsive navigation with mobile-first bottom tabs and breakpoint-aware adaptation.
- Prioritize timer correctness and logging trustworthiness.
- Include playlists and manual logging in V1.
- Avoid community and AI features in V1.

### 2026-03-23 app shell decisions
- Keep the goals route path as `/goals` for compatibility, but use the user-facing label `Sankalpa` in navigation.
- Implement route-level placeholder screens in `src/pages` to align with architecture guidance.
- Use a shared route metadata module to keep desktop and mobile navigation labels consistent.
- Keep the shell calm and minimal with a mobile bottom navigation and tablet/desktop sidebar layout.

### 2026-03-23 timer-history vertical slice decisions
- Keep the timer vertical slice local-only and persist last-used timer settings and session logs in localStorage.
- Use fixed mock sound selectors for start/end/interval behavior in this slice, without implementing audio playback.
- Model active timing in seconds and use end-time-based recalculation to preserve pause/resume correctness.
- Auto-create a session log for both `completed` and `ended early` outcomes with source set to `auto log`.
- Keep primary navigation unchanged and add route-level active timer at `/practice/active`.

### 2026-03-23 timer-history UX refinement decisions
- Require explicit confirmation before finalizing `ended early` to reduce accidental session interruption.
- Group optional timer controls under a collapsed `Advanced` section to keep setup focused and calm.
- Add explicit interval sound selection when interval bell is enabled, while keeping sound options mocked.
- Use progressive validation display on setup fields to reduce first-load error noise.
- Improve `history` readability on larger screens with timestamp emphasis and multi-column metadata layout.

### 2026-03-23 custom-plays manual-log vertical slice decisions
- Add a dedicated `custom play` model with local-only persistence and support create/edit/delete/favorite in the Practice screen.
- Keep `custom play` controls embedded within the existing Practice route-level screen to avoid navigation sprawl for this slice.
- Extend `session log` source typing to include both `auto log` and `manual log`.
- Add a bounded manual log form in `history` with required fields:
  - duration
  - meditation type
  - session timestamp
- Model manual entries as completed local logs with derived start/end timestamps and include them in the same unified history list.
- Use explicit source/status pills in `history` to clearly distinguish `manual log` vs `auto log` and `completed` vs `ended early`.

### 2026-03-23 custom-plays manual-log UX refinement decisions
- Implement explicit delete confirmation for `custom play` entries instead of silent immediate deletion.
- Add a primary `Use Custom Play` action that prefills timer setup duration and meditation type while preserving other timer options.
- Clarify duplicate field copy by renaming custom play fields to:
  - `Custom play meditation type`
  - `Custom play duration (minutes)`
- Add explicit post-save confirmation for manual log creation with inline success status.
- Add helper guidance for `session timestamp` to clarify local-time intent.
- Refine list row structure for `custom play` and `history` items to improve tablet/desktop scanability without introducing dense table UI.
