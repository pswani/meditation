# Core Full-Stack Review

## Scope
Milestone A was reviewed against the current `codex/prompts/milestone-a-core-fullstack` branch with focus on:

- UX and usability
- code quality
- backend design
- REST quality
- performance concerns
- engineering hygiene

## Critical issues
- None found in this review pass.

## Important issues

### 1. Timer-setting hydration can overwrite in-progress edits on Practice and Settings
- `src/pages/PracticePage.tsx:78` writes form edits straight into shared timer settings, but the screen stays editable while backend hydration is still in flight (`src/pages/PracticePage.tsx:114`, `src/pages/PracticePage.tsx:150`).
- `src/pages/SettingsPage.tsx:26` resets the local draft whenever `settings` changes, while the form remains editable during backend loading (`src/pages/SettingsPage.tsx:82`, `src/pages/SettingsPage.tsx:100`).
- `src/features/timer/TimerContext.tsx:535` later replaces local settings with hydrated backend values when they differ.
- Result: a user can start typing before hydration finishes and have those changes silently replaced by the arriving backend state. That is especially risky on slower backend startup or first-load H2 warmup, because the UI looks interactive before the source-of-truth defaults have settled.

### 2. Settings success feedback is optimistic and can contradict backend failures
- `src/pages/SettingsPage.tsx:57` and `src/pages/SettingsPage.tsx:58` show `Settings saved.` immediately after `setSettings(draft)`, before the backend write finishes.
- Actual persistence happens later in `src/features/timer/TimerContext.tsx:607`, and failures only surface asynchronously through `settingsSyncError` at `src/features/timer/TimerContext.tsx:621`.
- Result: the screen can simultaneously tell the user their defaults were saved and also show that the backend save failed. For a core settings flow, that creates false confidence about what is actually stored in H2.

## Nice-to-have issues

### 1. Practice edits currently mutate shared defaults immediately
- `src/pages/PracticePage.tsx:78` updates shared timer settings directly for every field change.
- `src/features/timer/TimerContext.tsx:592` persists any valid settings change back to the backend.
- Because Settings has an explicit `Save Defaults` action (`src/pages/SettingsPage.tsx:197`), the current behavior is a little surprising: a one-off timer tweak in Practice also rewrites the persisted defaults.
- This is not a blocker for Milestone A, but the product model would be clearer if Practice had a session draft separate from saved defaults.

### 2. `TimerContext` has become the main change-risk hotspot
- `src/features/timer/TimerContext.tsx` now owns:
  - timer runtime
  - playlist runtime
  - session-log hydration/sync
  - timer-settings hydration/sync
  - manual log persistence
  - custom-play CRUD
  - playlist CRUD
- The slice works, but future Milestone A changes will keep getting riskier until some of that logic is split into smaller hooks or domain modules.

### 3. Backend validation rules are duplicated in code rather than sourced from shared reference data
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogService.java:14`
- `backend/src/main/java/com/meditation/backend/settings/TimerSettingsService.java:12`
- Hard-coded meditation-type sets are acceptable for the current prototype, but they will drift if the reference table or frontend options evolve independently.

## Overall assessment
The milestone is in solid shape for a prototype full-stack core flow:

- backend startup works with H2
- REST contracts are live and used by the frontend
- the main timer -> `session log` -> History journey is verified
- Home and Practice now reflect backend loading state more honestly

The next remediation pass should stay tightly scoped to the two important issues above, because both affect user trust in the saved/defaulted timer experience.

## Remediation status
- 2026-03-26 prompt 04 remediated both important issues:
  - Practice and Settings now lock timer-setting controls until backend hydration settles.
  - Settings save feedback now waits for the actual backend persistence result instead of reporting optimistic success.
- Remaining open follow-up items are the `Nice-to-have issues` listed above.
