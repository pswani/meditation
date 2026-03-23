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
