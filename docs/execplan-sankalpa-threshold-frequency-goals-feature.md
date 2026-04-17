# ExecPlan: Sankalpa Threshold Frequency Goals Feature

## Objective
Extend meditation-derived `sankalpa` goals so duration-based and session-count-based goals can optionally use a recurring weekly cadence with a qualifying daily threshold, such as "Do Tratak for at least 15 minutes a day, at least 5 times a week, for 4 weeks."

## Why
The current `sankalpa` model only supports cumulative targets across a rolling day window. Users also need disciplined recurring goals that reflect threshold-based consistency rather than only summed minutes or raw session counts. This slice should add that expressiveness without turning Goals into a habit-dashboard product or breaking existing sankalpas.

## Scope
- keep existing cumulative duration-based and session-count-based sankalpas working unchanged
- keep existing `observance-based` sankalpas working unchanged
- add an optional recurring weekly cadence mode for meditation-derived goals
- support a qualifying daily threshold plus required qualifying days per week across a number of weeks
- derive consistent progress, completion, and expiration state from the same cadence model in frontend and backend
- persist the new fields through frontend local storage, sync replay, backend API, and H2
- update Home and Goals copy so the cadence remains readable and trustworthy
- add focused frontend and backend regression tests
- update durable docs, review doc, test doc, decisions, and session handoff

## Explicit Exclusions
- reminders or notifications for sankalpas
- custom recurrence rules beyond weekly cadence
- a separate habit tracker surface
- unrelated timer, history, audio, or native changes

## Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-observance-sankalpa-feature.md`
- `docs/test-observance-sankalpa-feature.md`
- bundle prompts under `prompts/sankalpa-threshold-frequency-goals-feature-bundle-with-branching/`

## Parent Branch And Assumptions
- Parent branch: `codex/defects-enhancements-16Apr`
- Feature branch: `codex/sankalpa-threshold-frequency-goals-feature-bundle-with-branching`
- Initial modeling assumption:
  - keep `goalType` unchanged
  - keep legacy cumulative goals identified by the absence of cadence fields
  - add one optional weekly cadence field for meditation-derived goals: required qualifying days per week
  - reuse `targetValue` as the qualifying daily threshold when cadence mode is enabled
  - keep `days` as the persisted overall goal window and require cadence-mode windows to be whole weeks, so the UI can edit weeks while persistence stays compatible

## Affected Files And Modules
- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/sankalpaApi.test.ts`
- `src/utils/storage/shared.ts`
- `src/utils/storage.test.ts`
- `src/features/sankalpa/SankalpaEditor.tsx`
- `src/features/sankalpa/SankalpaSection.tsx`
- `src/features/sankalpa/sankalpaPageHelpers.ts`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/features/sankalpa/useSankalpaProgress.test.ts`
- `src/features/home/HomePanels.tsx`
- `src/pages/SankalpaPage.tsx`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
- `backend/src/main/resources/db/migration/*`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-sankalpa-threshold-frequency-goals-feature.md`
- `docs/test-sankalpa-threshold-frequency-goals-feature.md`

## UX Behavior
- The Goals editor keeps the current meditation-derived goal types, then lets the user choose between:
  - a cumulative target within a day window
  - a recurring weekly cadence
- In recurring weekly cadence mode:
  - the user enters the daily qualifying threshold:
    - minutes for duration-based goals
    - session logs for session-count-based goals
  - the user enters qualifying days needed per week
  - the user enters the number of weeks
  - optional meditation type and time-of-day filters still apply
- Goals copy should explain the cadence in plain language, for example:
  - "At least 15 min on 5 days each week for 4 weeks"
- Goals cards should show cadence progress calmly, with enough detail to trust the math without adding dashboard clutter.
- Home should keep the active `sankalpa` snapshot compact and understandable for recurring goals.

## Data And State Model
- Extend `SankalpaGoal` for meditation-derived goals with an optional `qualifyingDaysPerWeek`.
- Keep `targetValue` and `days`:
  - cumulative mode:
    - `targetValue` stays the total minutes or total session logs in the whole window
    - `days` stays the rolling window length
  - recurring weekly cadence mode:
    - `targetValue` becomes the qualifying daily threshold
    - `qualifyingDaysPerWeek` becomes the weekly cadence requirement
    - `days` must equal whole weeks times 7
- Extend `SankalpaDraft` with UI-facing cadence state so the editor can distinguish cumulative vs recurring mode and store weeks cleanly.
- Extend `SankalpaProgress` with recurring-week progress details sufficient for Goals and Home copy.
- Persist the new cadence field through:
  - local storage normalization
  - frontend API request and response normalization
  - backend request validation and response mapping
  - H2 schema migration
- Keep queue-backed upsert and delete behavior unchanged at the boundary level.

## Progress Math
- For cumulative meditation-derived goals:
  - preserve existing total-duration or total-session-count behavior
- For recurring weekly cadence goals:
  - group matching session logs by local date inside the goal window
  - determine whether each local date qualifies:
    - duration-based: total matched duration on that date meets the qualifying daily threshold
    - session-count-based: matched session-log count on that date meets the qualifying daily threshold
  - split the goal window into week-sized periods anchored to the goal start date
  - a week counts as met when qualifying days in that week meet or exceed `qualifyingDaysPerWeek`
  - overall completion requires all weeks in the goal window to count as met

## Risks
- Week boundaries are sensitive to local-date handling and must stay aligned between frontend and backend.
- Reusing `targetValue` for two semantics is acceptable only if the UI, validation, and normalization make the active mode unambiguous.
- Existing cached or persisted sankalpas must normalize safely when the new cadence field is absent.
- The Home snapshot must stay calm even when recurring goals expose more nuance than cumulative goals.

## Milestones
1. Extend sankalpa types, storage normalization, and frontend progress helpers for recurring weekly cadence.
2. Update Goals and Home copy plus editor controls for the new mode.
3. Extend backend request validation, response mapping, persistence, and migration support.
4. Add focused frontend and backend regression tests.
5. Run the required verification suite and document results.
6. Complete review, fix follow-ups, and merge back to the parent branch.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- Focused manual checks for:
  - a recurring duration goal matching the Tratak example
  - a recurring session-count goal
  - qualifying and non-qualifying session logs moving week progress correctly
  - active, completed, expired, and archived states staying trustworthy

## Decision Log
- 2026-04-16: Keep the existing `goalType` vocabulary and add cadence only for meditation-derived goals, so the model stays additive instead of inventing a second goal product.
- 2026-04-16: Reuse `targetValue` as the qualifying daily threshold in cadence mode and add one explicit weekly cadence field, while keeping legacy cumulative mode identified by the absence of cadence fields.
- 2026-04-16: Keep `days` as the persisted goal window for compatibility, but require cadence-mode Goals UI to work in whole weeks and translate that into `days`.

## Progress Log
- 2026-04-16: Read the required repo, product, architecture, UX, roadmap, decisions, and handoff docs plus the bundle runner and bundle prompts.
- 2026-04-16: Reviewed the current frontend and backend `sankalpa` model, observance evidence, storage normalization, sync flow, Home snapshot, and backend controller coverage.
- 2026-04-16: Created `codex/sankalpa-threshold-frequency-goals-feature-bundle-with-branching` from `codex/defects-enhancements-16Apr`.
- 2026-04-16: Implemented recurring weekly cadence support for meditation-derived `sankalpa` goals across frontend types, editor UX, Home and Goals copy, local storage normalization, API normalization, backend validation, persistence, and H2 migration support.
- 2026-04-16: Added focused frontend and backend regression coverage for recurring duration and session-count goals, compatibility when cadence fields are absent, and recurring progress derivation across active, completed, expired, and archived states.
- 2026-04-16: Verified the slice with `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`, then updated the review, test, decisions, and handoff artifacts for merge readiness.
