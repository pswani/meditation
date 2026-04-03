# ExecPlan: Sankalpa Edit And Archive

## Objective
Implement end-to-end `sankalpa` edit and archive flows across the Goals screen, local-first persistence, and the backend API.

## Why
The app already supports creating and tracking `sankalpa` goals, but the current model is still create-only. Users need a trustworthy way to correct a goal, archive one that is no longer relevant, and keep progress and deadline behavior clear after those state changes.

## Scope
- add editable `sankalpa` form behavior for existing goals
- add archive actions and an archived goals section
- keep progress calculations and deadline derivation consistent after edits and archive
- align frontend storage, API normalization, and backend persistence with the new archived state
- add focused tests for load-bearing sankalpa logic and user flow

## Explicit Exclusions
- delete or restore flows
- new goal types
- summary redesign outside the copy or states needed by this slice
- unrelated timer, playlist, or media refactors

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
- `src/utils/storage.ts`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- sankalpa frontend tests
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- backend sankalpa tests

## UX Behavior
- Active, completed, and expired goals show Edit and Archive actions.
- Edit mode reuses the existing form with clear “save changes” and “cancel edit” actions.
- Editing preserves the existing goal id and creation timestamp so the current goal window stays trustworthy.
- Archiving uses a lightweight inline confirmation, then moves the goal into a dedicated archived section.
- Archived goals remain visible for reference but are no longer treated as active/completed/expired.
- Empty states stay calm and specific for each section.

## Data And State Model
- Extend `SankalpaGoal` with an `archived` flag.
- Extend `SankalpaStatus` and partitioning to include `archived`.
- Keep archive as an upsert through the existing queue-backed sankalpa sync flow rather than adding a separate delete/archive endpoint.
- Backend list responses include archived goals so the UI can render an archived section from the same progress response model.

## Risks
- Editing completed or expired goals can legitimately move them back to active; the UI copy and progress derivation need to make that feel intentional rather than broken.
- Existing local caches and API payloads may not include `archived`, so normalization must default safely to `false`.
- The backend already has an `archived` column, so the main risk is contract mismatch rather than schema churn.

## Milestones
1. Extend sankalpa domain types, helper logic, and normalization for archived state.
2. Update the Goals screen and sankalpa hook for edit and archive interactions.
3. Update backend sankalpa request/response handling to round-trip archived goals.
4. Add focused frontend and backend regression tests.
5. Run verification and update durable docs.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## Decision Log
- Keep edit and archive in the existing `PUT /api/sankalpas/{id}` flow so the local-first replay model stays simple and id-stable.
- Preserve `createdAt` when editing so progress windows and deadlines remain anchored to the same goal rather than silently restarting.

## Progress Log
- 2026-04-02: reviewed current sankalpa UI, helper, storage, and backend code; confirmed the backend already stores an `archived` flag but the current slice is still create-only.
