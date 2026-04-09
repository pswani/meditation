# ExecPlan: Observance Sankalpa Feature

## Objective
Implement an `observance-based` sankalpa mode that lets users define a manual observance such as brahmacharya or eating before 7 PM, then mark each scheduled date as observed or missed from the Goals screen.

## Why
The current `sankalpa` model only works for goals the app can derive from `session log` history. Users also need a trustworthy way to track discipline-oriented observances that the app cannot infer automatically, while keeping the experience calm, auditable, and aligned with the existing Goals flow.

## Scope
- add an `observance-based` sankalpa goal type
- add an observance label field for that goal type
- add manual per-date observance records with `observed` or `missed` state
- show scheduled observance dates and allow updating their status from the Goals screen
- persist observance-based sankalpas through the existing local-first frontend path and backend API
- keep existing duration-based and session-count-based sankalpas working without behavioral regression
- create a reusable prompt bundle for the slice under `prompts/`

## Explicit Exclusions
- custom non-contiguous date schedules outside the current rolling `days` window
- notes, journaling, or attachments per observance date
- reminders or notification scheduling for observance check-ins
- summary-page aggregation of observance data outside the existing sankalpa progress surfaces
- unrelated refactors outside the touched sankalpa flow

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

## Affected Files And Modules
- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/storage/shared.ts`
- `src/utils/storage.test.ts`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/HomePage.tsx`
- focused frontend tests for sankalpa helpers, API normalization, and Goals/Home behavior
- `backend/src/main/java/com/meditation/backend/reference/ReferenceData.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/main/resources/db/migration/*`
- backend sankalpa controller tests
- `prompts/observance-sankalpa-feature-bundle-with-branching/*`

## UX Behavior
- The Goals form adds an `Observance goal` option alongside the existing meditation-derived goal types.
- Choosing `Observance goal` swaps the meditation target/filter fields for:
  - a required observance label
  - the number of days to track
  - calm helper copy explaining that each scheduled date is marked manually
- The app treats observance goals as daily date-based tracking within the goal window.
- Each observance goal shows a compact date list with a per-date status control:
  - `Pending`
  - `Observed`
  - `Missed`
- Future dates stay visible but are not editable until that date arrives.
- Progress copy remains explicit about observed dates, missed dates, and remaining dates so the user can audit why a goal is active, completed, or expired.
- Archived observance goals remain readable but do not create extra UI clutter.
- The Home snapshot still shows the top active sankalpa, including observance-based ones, with meaningful labels.

## Data And State Model
- Extend `SankalpaGoalType` with `observance-based`.
- Extend `SankalpaGoal` with:
  - `observanceLabel`
  - `observanceRecords`
- Store only explicit per-date manual records:
  - `observed`
  - `missed`
- Treat `pending` as a derived UI state when a scheduled date has no saved manual record.
- Keep the existing queue-backed upsert/delete flow for sankalpas:
  - marking an observance date updates the same goal record
  - no second sync surface is introduced
- Backend persistence uses a child table keyed by `(sankalpa_id, observance_date)` so records remain queryable and normalized.
- For observance goals, progress derivation is record-driven rather than `session log`-driven.

## Risks
- Date-based observance windows are more sensitive to time-zone handling than the current timestamp-based meditation goals.
- Reusing the existing `targetValue` field for observance goals needs careful validation so frontend and backend do not drift.
- The Goals screen is already large, so new UI needs to stay calm and avoid making the form or list feel noisy on phones.
- Local cache normalization must remain backward compatible with older sankalpa entries that do not contain observance fields.

## Milestones
1. Extend sankalpa domain types, validation, and progress helpers for observance-based goals and per-date records.
2. Update local storage and API normalization to round-trip observance fields safely.
3. Implement observance-based creation and per-date marking in the Goals UI, plus any supporting Home snapshot updates.
4. Add backend schema and service support for observance labels and per-date observance records.
5. Add focused frontend and backend regression tests.
6. Update durable docs and add the reusable prompt bundle.
7. Run required verification commands and record results.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## Decision Log
- Keep observance tracking inside the existing `sankalpa` domain instead of creating a separate habit-tracking feature because the user intent is still explicitly `sankalpa`.
- Model observance progress by explicit per-date records and derive `pending` from missing entries so the stored data stays compact and auditable.
- Treat observance goals as daily window-based tracking and disable future-date edits to avoid accidental premature marking.
- Preserve the existing local-first queue model by saving observance changes through the same full-goal upsert boundary.

## Progress Log
- 2026-04-07: Reviewed required product, UX, architecture, roadmap, decisions, and handoff docs plus the current frontend/backend sankalpa implementation.
- 2026-04-07: Chose an `observance-based` sankalpa mode with manual per-date records and a derived `pending` state rather than trying to infer observance from meditation data.
- 2026-04-07: Implemented frontend sankalpa types, observance helpers, Goals UI check-ins, and Home snapshot support.
- 2026-04-07: Added backend observance persistence, validation, progress derivation, and Flyway migration support.
- 2026-04-07: Added focused frontend and backend regression coverage plus a reusable prompt bundle for the slice.
- 2026-04-07: Verified the slice with frontend typecheck, lint, test, build, and backend Maven verify.
