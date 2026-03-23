# ExecPlan: Timer + Auto Log + History Vertical Slice

## 1. Objective
Implement a bounded vertical slice covering timer setup, active timer flow, completion handling, automatic session logging, and recent history display.

## 2. Why
This slice delivers the first fully functioning meditation journey from setup to session log visibility, aligned with roadmap priorities and calm multi-device UX goals.

## 3. Scope
Included:
- Timer Setup screen with:
  - duration
  - meditation type from predefined list
  - optional start sound selector from fixed mock list
  - optional end sound selector from fixed mock list
  - optional interval bell configuration
  - validation for duration, required meditation type, and interval fit rules
- Start session action from setup
- Active Timer screen with:
  - running countdown display
  - pause
  - resume
  - end early
- Completion flow:
  - completed state when timer reaches zero
  - ended early state when user ends before zero
- Automatic session log creation:
  - create auto log on completion
  - create auto log on early end with actual completed duration and status
- History screen:
  - show recent session logs
  - clear empty state
  - clear distinction between completed and ended-early status
- Local-only prototype persistence for:
  - recent session logs
  - last-used timer setup settings
- Responsive UX across mobile, tablet, and desktop

Excluded:
- custom plays
- playlists
- manual session logging
- summaries
- sankalpa goals
- backend/cloud sync
- notifications
- real audio playback (mock selection/state only)

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

## 5. Affected files and modules
- `src/pages/PracticePage.tsx`
- `src/pages/ActiveTimerPage.tsx` (new)
- `src/pages/HistoryPage.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/features/timer/*` (new)
- `src/types/*` (new shared types)
- `src/utils/*` (new validation and persistence helpers)
- `src/App.test.tsx` (if needed for route/shell expectations)
- new focused tests for timer domain logic
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Timer setup is easy to scan and keeps advanced interval controls hidden unless enabled.
- Active timer is focused and distraction-free.
- Pause/resume preserves timer correctness.
- Ending early requires explicit action and still creates an auto log.
- History lists recent session logs with readable metadata and explicit status labels (`completed` vs `ended early`).
- Layout remains responsive and touch-friendly across breakpoints.

## 7. Data and state model
- Local timer settings model includes:
  - durationMinutes
  - meditationType
  - startSound
  - endSound
  - intervalEnabled
  - intervalMinutes
- Active session model includes:
  - configured duration
  - remaining seconds
  - timing metadata for pause/resume correctness
  - current status (running/paused/completed/ended early)
- Session log model includes:
  - id
  - startedAt
  - endedAt
  - meditation type
  - intended duration minutes
  - completed duration minutes
  - log source (`auto log`)
  - status (`completed` or `ended early`)
  - selected sound metadata (mock values)
- Persist state in localStorage for prototype behavior.

## 8. Risks
- Timer drift or pause/resume timing inaccuracies.
- Incorrect interval validation edge cases near session boundaries.
- Logging incorrect completed duration during early end.
- Over-scoping UI beyond this vertical slice.

## 9. Milestones
1. Define domain types, constants, validation, and persistence helpers.
2. Implement timer feature state/reducer and session log creation logic.
3. Build timer setup and active timer screens.
4. Wire auto logging and history screen.
5. Add focused tests for load-bearing logic.
6. Update docs and run verification commands.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - invalid duration blocks start
  - missing meditation type blocks start
  - invalid interval is surfaced
  - pause/resume preserves remaining time behavior
  - completed session auto logs as `completed`
  - early-end session auto logs as `ended early`
  - history empty state and recent logs rendering

## 11. Decision log
- Keep this implementation local-only with no backend dependencies.
- Store durations in seconds during active timing and normalize to minutes for session log display.
- Keep sound options fixed and mocked for this slice.

## 12. Progress log
- Completed: source docs review and scope alignment for this vertical slice.
- Completed: domain types, validation utilities, timer reducer/state, and local persistence helpers.
- Completed: route-level screens for Timer Setup, Active Timer, and History.
- Completed: completion/ended-early flow with automatic session log creation.
- Completed: focused tests for timer validation, interval behavior, session-log creation, and reducer logic.
- Completed: verification run on 2026-03-23 (`typecheck`, `lint`, `test`, `build`).
