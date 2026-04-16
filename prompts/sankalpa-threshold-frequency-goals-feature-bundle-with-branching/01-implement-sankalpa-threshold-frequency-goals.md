# 01 Implement Sankalpa Threshold And Frequency Goals

Implement a cohesive end-to-end `sankalpa` enhancement for recurring threshold-based goals.

Feature intent:
- Duration-based goals should support a minimum qualifying meditation amount plus a recurring target such as qualifying days per week across a number of weeks.
- Session-count goals should support a minimum number of qualifying occurrences across the same recurring window.
- Progress tracking, display copy, and completion logic must reflect the same recurring threshold model.

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-sankalpa-threshold-frequency-goals-feature.md`.
- Preserve existing `observance-based` goals and keep legacy duration or session-count goals compatible through normalization or migration.
- Keep the Goals screen calm and avoid turning it into a dashboard-heavy planner.
- Keep local-first behavior, backend persistence, and offline sync trustworthy.

Likely files:
- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/features/sankalpa/SankalpaEditor.tsx`
- `src/features/sankalpa/SankalpaSection.tsx`
- `src/features/sankalpa/sankalpaPageHelpers.ts`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/HomePage.tsx`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/main/resources/db/migration/*`
- focused frontend and backend tests

Acceptance targets:
- The new model can express the user example of a meditation type needing a minimum qualifying amount and a minimum number of qualifying times per week for a number of weeks.
- Duration-based progress counts only qualifying days or sessions according to the chosen model, not raw total minutes alone.
- Session-count progress reflects the same cadence logic.
- Goals UI copy explains the threshold and cadence clearly.
- Home and Goals progress surfaces remain readable and trustworthy.
- Backend persistence and local-first replay round-trip the new fields safely.

Required follow-through:
- Add or update focused frontend and backend tests.
- Update durable docs, including `requirements/session-handoff.md`.
- Update `requirements/decisions.md` for any long-lived modeling decisions.

Do not absorb:
- reminders or notifications for sankalpas
- a separate habit-tracker product surface
- unrelated History, audio, or native defects

When implementation is stable, hand off to `02-review-sankalpa-threshold-frequency-goals.md`.
