# ExecPlan: Open-Ended Timer Review Fixes

## Objective
Address the important issues from `docs/review-open-ended-timer.md` without broadening the milestone beyond the open-ended timer feature and its immediate integration points.

## Scope
- clean up the timer settings contract so open-ended mode does not require a planned duration at the API boundary
- preserve smooth switching back to fixed mode through an explicit last fixed duration fallback
- make open-ended messaging mode-aware in the active timer and quick-start entry flow
- update focused frontend and backend tests

## Exclusions
- playlist redesign
- custom play redesign
- broader timer UX refactors outside the reviewed issues
- offline/sync architecture changes unrelated to the timer settings contract

## Files in play
- `src/types/timer.ts`
- `src/features/timer/constants.ts`
- `src/features/timer/timerReducer.ts`
- `src/pages/PracticePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/utils/timerValidation.ts`
- `src/utils/timerSettingsApi.ts`
- `src/utils/storage.ts`
- `src/utils/customPlay.ts`
- `backend/src/main/java/com/meditation/backend/settings/*`
- focused frontend/backend test files
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## Risks
- changing the timer settings shape can ripple across local storage, API mocks, and queue-backed saves
- the fix needs to preserve fixed-duration regressions while cleaning up open-ended modeling
- older locally stored timer settings must still hydrate safely

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 clean test`

## Progress log
- 2026-03-30: Started the prompt 03 fix pass from the committed review findings.
- 2026-03-30: Updated timer settings modeling so open-ended mode can persist without a planned duration at the API boundary while retaining an explicit last fixed duration fallback for switching back.
- 2026-03-30: Fixed remaining open-ended wording drift in quick start and active-session confirmation, then re-ran the required frontend and backend verification commands.
