# Open-Ended Timer Review

## Summary
The shipped open-ended timer feature is directionally strong: the mode is discoverable, the active session screen is calm, and the `session log` / History integration stays understandable. No critical issues were identified in this review pass. The most important follow-up work is tightening the backend timer-settings contract so it models open-ended mode more cleanly and removing a few remaining places where open-ended flows still inherit fixed-duration language.

## Critical issues
- None.

## Important issues

### 1. Backend timer settings still require a fixed duration even when timer mode is open-ended
- Where it appears:
  - `backend/src/main/java/com/meditation/backend/settings/TimerSettingsService.java`
- Why it is a problem:
  - The feature works today because the frontend quietly keeps the last fixed `durationMinutes` value around even when the user switches to open-ended mode.
  - That keeps the UI functional, but the backend contract itself still says open-ended timer settings are invalid unless they include a positive duration.
  - This weakens the data model cleanliness requested by the milestone prompt because the API cannot represent “open-ended with no planned duration” on its own; it only works through a frontend workaround.
- Recommended fix:
  - Allow open-ended timer settings requests to omit or null out the planned duration at the contract boundary.
  - If preserving the last fixed duration remains desirable for UX, store that as an explicit fallback/default concern rather than making open-ended mode depend on a hidden required fixed-duration field.

### 2. A few user-facing messages still frame open-ended sessions as fixed-duration flows
- Where it appears:
  - `src/pages/HomePage.tsx`
  - `src/pages/ActiveTimerPage.tsx`
- Why it is a problem:
  - When quick start fails, Home still tells the user to review “duration and meditation type,” even though duration is not required in open-ended mode.
  - The active-timer confirmation dialog keeps the accessible label “End session early confirmation” even for open-ended sessions, which conflicts with the visible “End Session” wording and makes the flow feel slightly inconsistent.
  - These are small details, but they are precisely the kind of wording drift that can make the new mode feel bolted onto the fixed timer instead of intentionally designed.
- Recommended fix:
  - Make validation guidance and confirmation labels mode-aware so open-ended users see language about ending the session, not leaving early or fixing duration.

## Nice-to-have improvements

### 1. Surface open-ended mode more consistently outside History
- Where it appears:
  - `src/app/AppShell.tsx`
  - `src/pages/HomePage.tsx`
- Why it is a problem:
  - History clearly shows the open-ended badge, but shell-level and recent-activity surfaces give much less context once the user leaves the active timer screen.
  - The feature remains usable, yet a little more context would make the mode feel more coherent across the app.
- Recommended fix:
  - Consider adding lightweight mode context in the shell active banner and recent activity summaries when the current or recent `session log` used open-ended mode.
