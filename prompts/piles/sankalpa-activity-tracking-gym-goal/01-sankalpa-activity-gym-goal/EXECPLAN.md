# ExecPlan: Sankalpa Activity Gym Goal

## Objective

Support a gym-style `observance-based` sankalpa for 5 observed days per week over 4 weeks, then improve active sankalpa activity tracking so daily observed, missed, and pending evidence is easy to audit.

## Why

The app already supports manual observance goals for disciplines outside meditation logs. Gym attendance fits that same Sankalpa model, but it needs weekly cadence semantics rather than an all-days target.

## Scope

Included:

- Reuse `observanceLabel` as the user-facing label for `Gym`.
- Allow `observance-based` goals to carry `qualifyingDaysPerWeek`.
- Represent 4 weeks as a 28-day goal window.
- Derive weekly observance progress from explicit per-date `observed` records.
- Add a calm editor path that prefills `Gym`, 5 days per week, 4 weeks.
- Show active observance activity as week-grouped daily rows with visible text states.
- Update focused frontend and backend tests plus durable docs.

Excluded:

- No separate habit tracker.
- No `session log` inference for gym observance.
- No new title field beyond `observanceLabel`.
- No Home dashboard expansion.

## Source Documents

- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `PLANS.md`
- `docs/codex-staged-workflow-design.md`
- `prompts/reasoning-effort-profiles.md`
- group and bundle prompts under `prompts/piles/sankalpa-activity-tracking-gym-goal/01-sankalpa-activity-gym-goal/`

## Affected Files And Modules

- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/storage/shared.ts`
- `src/features/sankalpa/SankalpaEditor.tsx`
- `src/features/sankalpa/ObservanceTracker.tsx`
- `src/features/sankalpa/SankalpaSection.tsx`
- `src/features/sankalpa/sankalpaPageHelpers.ts`
- `src/pages/SankalpaPage.test.tsx`
- `backend/src/main/java/com/meditation/backend/sankalpa/SankalpaService.java`
- `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
- durable docs listed in the group closeout prompt

## UX Behavior

- The Goals screen remains titled `Sankalpa`.
- The editor exposes a small preset action for a gym observance sankalpa.
- Preset values remain editable before save.
- Future dates stay visible and disabled.
- Week grouping is preferred over a calendar grid because it keeps state labels explicit, reads well on phone screens, and avoids a dashboard-like visual density inside sankalpa cards.

## Data And State Model

- `observanceLabel` remains the label/title for observance goals.
- `qualifyingDaysPerWeek` becomes valid for `observance-based` goals.
- For weekly observance goals:
  - `targetValue` stores the weekly target as the number of observed days required per week.
  - `days` stores the full window length, normally a whole number of weeks.
  - `targetObservanceCount` is the number of weeks in the window.
  - `matchedObservanceCount` is the number of weeks met.
  - daily `observanceDays` remain available for evidence and check-ins.
  - `recurringWeeks` carries week-level progress.
- For existing cumulative observance goals:
  - `targetValue` remains equal to `days`.
  - progress stays based on total observed dates.

## Risks

- Backend and frontend progress derivation can drift if weekly observance semantics are implemented differently.
- Existing stored observance goals must remain valid when they do not have `qualifyingDaysPerWeek`.
- A 28-day activity list can become noisy if shown fully expanded inside active cards.
- Browser tests need stable date handling because observance status depends on today.

## Milestones

1. Implement weekly observance domain and backend acceptance.
2. Add the gym preset/editor path and focused tests.
3. Improve active tracking presentation with week-grouped daily evidence.
4. Update durable docs.
5. Run focused and full verification.

## Verification

- `npm run test -- --run src/utils/sankalpa.test.ts src/pages/SankalpaPage.test.tsx`
- `npm run test -- --run src/pages/SankalpaPage.test.tsx src/features/sankalpa/useSankalpaProgress.test.ts src/utils/sankalpa.test.ts`
- backend Sankalpa tests or `./scripts/pipeline.sh verify` if backend code changes
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Browser checks for `/goals` at phone and desktop widths when the UI changes are complete.

## Decision Log

- Use `observanceLabel` for `Gym`; a separate title would duplicate the existing observance naming field.
- Reuse `qualifyingDaysPerWeek` for observance weekly cadence to avoid a second cadence model.
- Use week-grouped daily rows rather than a calendar grid for active tracking because text states remain explicit and the layout stays calmer on phones.

## Progress Log

- Created plan and confirmed existing weekly cadence foundation excludes observance goals.
- Implemented weekly observance cadence across frontend domain helpers, local/API validation, backend validation, and backend progress derivation.
- Added the Sankalpa editor gym preset and week-grouped observance tracking UI.
- Updated durable docs with the weekly observance and daily-listing presentation decisions.
- Verified focused frontend and backend Sankalpa tests, full frontend typecheck/lint/test/build, and `./scripts/pipeline.sh verify`.
- Browser-checked `/goals` at phone and desktop widths with screenshots; MCP click/evaluate interactions were cancelled, so the create/edit flow is covered by page tests rather than interactive browser input.
- Branch creation and process cleanup were limited by sandbox permissions: `git switch -c` could not lock `.git/refs`, and the temporary Vite process on port 5173 could not be killed from the sandbox.
