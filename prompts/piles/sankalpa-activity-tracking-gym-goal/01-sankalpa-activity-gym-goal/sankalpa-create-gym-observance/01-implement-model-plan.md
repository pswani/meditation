# Implement: Model Plan For Gym Observance

Use the `bundle-implementation` reasoning profile.

## Objective

Define the narrow Sankalpa model path for a gym goal: "Gym, 5 observed days per week, for 4 weeks."

## Required Reading

Read the enclosing group docs plus:

- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/features/sankalpa/SankalpaEditor.tsx`
- `src/features/sankalpa/ObservanceTracker.tsx`
- `src/utils/sankalpaApi.ts`
- `src/utils/storage/collections.ts`
- `backend/src/main/java/com/meditation/backend/sankalpa/`
- current Sankalpa Flyway migrations
- `contracts/sync-contract.json` and generated sync constants if Sankalpa queue payload shape changes

## Implementation Direction

Before coding, create or update a task-specific ExecPlan for this bundle because this may involve data model/API changes. Keep it temporary and plan to fold durable conclusions into docs before final cleanup.

Analyze whether existing `observanceLabel` is enough as the free-form user-facing title for "Gym." Only add a separate `title` field if it avoids real ambiguity and can be kept narrow across frontend, backend, storage, and sync. Do not add a broad habit model.

Expected model direction:

- Allow `observance-based` sankalpas to express weekly cadence.
- Reuse or adapt `qualifyingDaysPerWeek` for observance goals when cadence is weekly.
- Represent 4 weeks as a 28-day window.
- Keep per-date observance records as the evidence source.
- Keep pending derived from missing records.
- Preserve archived/edit semantics and id-stable updates.

## Deliverable

By the end of this prompt, the implementation plan should be coherent and product code may be changed only for model/domain foundations that are clearly within this bundle.
