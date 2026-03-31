# ExecPlan: Open-Ended Timer

## 1. Objective
Implement an open-ended meditation timer mode that lets the user start without a fixed duration, see elapsed time during the session, pause and resume safely, end manually, and create a trustworthy `session log` using the actual elapsed duration.

## 2. Why
The current timer requires a fixed duration, which blocks a common meditation flow where the user wants to begin immediately and decide when to end based on the session itself. This slice adds that flexibility without weakening timer clarity, `session log` trustworthiness, or the existing fixed-duration flow.

## 3. Scope
Included:
- timer setup support for choosing fixed-duration vs open-ended mode
- active timer behavior for open-ended sessions
- elapsed-time display and calm open-ended copy
- pause, resume, and manual end behavior
- `session log` creation using actual elapsed time
- history representation for open-ended sessions
- timer settings and session-log API/data updates needed for correctness
- focused frontend and backend test updates

Excluded:
- playlist runtime redesign
- `custom play` feature redesign
- offline/sync architecture redesign
- unrelated timer UX refactors outside the new mode

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/open-ended-timer-feature-bundle-with-branching/01-implement-open-ended-timer.md`

## 5. Affected files and modules
- Frontend timer domain:
  - `src/types/timer.ts`
  - `src/types/sessionLog.ts`
  - `src/features/timer/timerReducer.ts`
  - `src/features/timer/TimerContext.tsx`
  - `src/features/timer/timerSoundPlayback.ts`
  - `src/features/timer/constants.ts`
  - `src/features/timer/timerContextObject.ts`
- Frontend UI:
  - `src/pages/PracticePage.tsx`
  - `src/pages/ActiveTimerPage.tsx`
  - `src/pages/HistoryPage.tsx`
  - `src/pages/HomePage.tsx`
  - `src/pages/SettingsPage.tsx`
  - `src/index.css`
- Frontend helpers and persistence:
  - `src/utils/timerValidation.ts`
  - `src/utils/sessionLog.ts`
  - `src/utils/sessionLogApi.ts`
  - `src/utils/timerSettingsApi.ts`
  - `src/utils/manualLog.ts`
  - `src/utils/playlistLog.ts`
  - `src/utils/customPlay.ts`
  - `src/utils/storage.ts`
- Backend:
  - `backend/src/main/java/com/meditation/backend/settings/*`
  - `backend/src/main/java/com/meditation/backend/sessionlog/*`
  - `backend/src/main/resources/db/migration/*`
- Tests:
  - timer reducer/context/page tests
  - storage/API/validation tests
  - backend controller tests

## 6. UX behavior
- Timer setup shows a clear mode choice between fixed-duration and open-ended.
- Fixed-duration remains the default and keeps the current duration-first path.
- Open-ended mode hides the required-duration dependency and explains that the session ends manually.
- Start sound still plays at session start.
- Interval sounds remain available in open-ended mode and repeat at the chosen cadence.
- Active timer shows:
  - countdown for fixed-duration sessions
  - elapsed time for open-ended sessions
- Fixed-duration sessions keep “End Early”.
- Open-ended sessions use “End Session” and create a `completed` auto log rather than an `ended early` log.
- History clearly distinguishes open-ended entries without pretending they had a planned finish time.

## 7. Data and state model
- Add `timerMode` with values:
  - `fixed`
  - `open-ended`
- `TimerSettings` persists `timerMode` plus the last fixed `durationMinutes` value.
- `ActiveSession` stores `timerMode`, elapsed-time progress, pause state, and an optional intended duration.
- `SessionLog` stores `timerMode` and allows `intendedDurationSeconds` to be `null` for open-ended sessions.
- Manual logs and playlist-derived logs remain `fixed`.
- Backend timer settings and `session_log` persistence mirror the new `timerMode` field.

## 8. Risks
- Active-session recovery and pause/resume correctness can regress if elapsed-time state is not persisted carefully.
- Existing frontend and backend validators currently assume intended duration is always present and positive.
- History and summary surfaces must continue to work when open-ended logs have no planned duration.
- API normalization and browser storage must remain backward-compatible with older saved data that has no `timerMode`.

## 9. Milestones
1. Extend timer/session-log domain types, validation, and storage normalization for `timerMode`.
2. Refactor active-session reducer/context logic to support open-ended elapsed tracking and pause/resume correctness.
3. Update Practice, Active Timer, History, Home, and Settings UI for calm mode selection and representation.
4. Extend backend timer settings and `session log` contracts plus migration support.
5. Add focused frontend/backend tests and run verification commands.
6. Update docs, decisions, and handoff for prompt 01 completion.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- manual local UI check if needed after automated verification

## 11. Decision log
- Persist `timerMode` across timer settings, active-session state, and `session log` records so open-ended behavior stays explicit instead of being inferred from missing duration alone.
- Keep `durationMinutes` in timer settings even when open-ended mode is selected so the last fixed-duration preference is preserved when the user switches back.
- Treat manual completion of an open-ended timer as `completed`, not `ended early`, because there is no scheduled end to leave early.
- Keep interval bells available for open-ended sessions; they repeat on elapsed-time milestones instead of relying on a total duration.

## 12. Progress log
- 2026-03-30: Reviewed prompt sequence, current timer/session-log architecture, timer settings/session-log APIs, storage validators, and the main Practice/Active Timer/History/Home/Settings integration points.
- 2026-03-30: Locked the implementation approach for prompt 01 and prepared the edit plan.
- 2026-03-30: Implemented open-ended timer mode across timer setup, active-session state, history representation, storage normalization, and backend timer settings/session-log contracts.
- 2026-03-30: Added focused frontend and backend test coverage for open-ended mode behavior, then ran the required frontend and backend verification commands.
