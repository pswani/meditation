# 00 Create Branch

Bundle: `sankalpa-threshold-frequency-goals-feature-bundle-with-branching`

Goal: extend `sankalpa` goals so duration-based and session-count goals can express minimum qualifying thresholds and recurring weekly cadence, such as “Do Tratak for at least 15 minutes a day, at least 5 times a week, for 4 weeks.”

Before branching:
- Read `AGENTS.md`, `PLANS.md`, `README.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Review the existing sankalpa evidence:
  - `docs/execplan-observance-sankalpa-feature.md`
  - `docs/test-observance-sankalpa-feature.md`
  - the current frontend and backend `sankalpa` helpers and tests
- Inspect the likely touched files:
  - `src/types/sankalpa.ts`
  - `src/utils/sankalpa.ts`
  - `src/features/sankalpa/*`
  - `src/pages/SankalpaPage.tsx`
  - `src/pages/HomePage.tsx`
  - `backend/src/main/java/com/meditation/backend/sankalpa/*`
  - `backend/src/main/resources/db/migration/*`
- Create an ExecPlan at `docs/execplan-sankalpa-threshold-frequency-goals-feature.md`.
- Reserve the review and test outputs:
  - `docs/review-sankalpa-threshold-frequency-goals-feature.md`
  - `docs/test-sankalpa-threshold-frequency-goals-feature.md`

Branching steps:
1. Use `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
2. Create `codex/sankalpa-threshold-frequency-goals-feature-bundle-with-branching`.
3. Record the parent branch and initial model assumptions in the ExecPlan.

Stop and realign if:
- the example requirements imply a much broader recurring-goal system than this repo should absorb in one slice
- the current sankalpa model cannot be extended compatibly without a deliberate migration decision that the repo docs do not answer

Then continue with `01-implement-sankalpa-threshold-frequency-goals.md`.
