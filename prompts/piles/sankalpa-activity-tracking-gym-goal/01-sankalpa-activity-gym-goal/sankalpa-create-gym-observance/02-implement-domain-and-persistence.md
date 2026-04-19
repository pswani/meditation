# Implement: Domain And Persistence

Use the `bundle-implementation` reasoning profile.

## Objective

Implement the Sankalpa domain, persistence, and API changes needed for weekly observance goals.

## Scope

Work in the smallest necessary set of files, likely including:

- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/storage/collections.ts`
- `src/utils/syncQueue.ts` only if queue payloads require migration
- `backend/src/main/java/com/meditation/backend/sankalpa/`
- `backend/src/main/resources/db/migration/`
- generated sync contract files only if the canonical contract changes

## Requirements

- Validate observed days per week as a whole number from 1 to 7.
- Validate weeks/days as positive whole numbers.
- Derive weekly observance progress from per-date observed records grouped by local week.
- Mark a week met only when observed days meet the weekly target.
- Keep missed and pending daily evidence available for UI.
- Keep future-date check-ins locked.
- Keep backend-aware persistence straightforward; add a migration only if the database shape changes.
- Preserve old stored sankalpas through normalization/migration behavior.

## Tests

Add or update focused tests for:

- creating a gym-style observance goal from a draft
- validation failures for invalid weekly cadence values
- progress derivation for met, active, missed, and upcoming weeks
- normalization of existing observance records
- backend request/response mapping if changed
