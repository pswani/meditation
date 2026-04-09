Read before implementation:
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Implementation objective:
- Add an `observance-based` sankalpa mode that lets users manually mark each scheduled date as observed or missed for goals the app cannot infer from meditation history.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-observance-sankalpa-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
   - why the feature matters
   - scope and exclusions
   - affected modules
   - UX behavior and validations
   - data and state model
   - risks and tradeoffs
   - milestones
   - verification plan
   - decision log
   - progress log

Required behavior:
1. Extend the sankalpa domain with an `observance-based` goal type.
2. Require an observance label such as `Brahmacharya` or `Meal before 7 PM` for that goal type.
3. Track observance progress through manual per-date records inside the goal window.
4. Surface a calm per-date tracker in the Goals screen with `Pending`, `Observed`, and `Missed` states.
5. Prevent editing future dates before they arrive.
6. Preserve existing duration-based and session-count-based sankalpa flows.
7. Keep the existing local-first queue-backed save behavior rather than inventing a second sync path.
8. Keep the UI responsive and uncluttered on mobile, tablet, and desktop.

Suggested implementation direction:
- Add focused sankalpa helpers for observance date windows, record normalization, and progress derivation.
- Keep `pending` as derived UI state instead of storing it explicitly if that keeps the data model cleaner.
- If the Goals screen becomes harder to maintain, extract small sankalpa-specific helpers or components rather than widening into unrelated refactors.
- Extend the backend sankalpa contract and persistence with normalized observance-record support.

Expected affected areas:
- `src/types/sankalpa.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/storage/shared.ts`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/HomePage.tsx`
- `backend/src/main/java/com/meditation/backend/reference/ReferenceData.java`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/main/resources/db/migration/*`

Required tests:
- Add or update focused frontend tests for sankalpa validation, progress derivation, API normalization, and Goals behavior.
- Add or update backend tests for observance-goal save, list, and progress behavior.
- Avoid shallow tests that do not protect the load-bearing logic.

Documentation updates:
- Update `README.md` if the product surface changes materially.
- Update `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, or `docs/screen-inventory.md` where the new goal type changes durable behavior or structure.
- Update `requirements/decisions.md` for durable data-model or UX decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Suggested durable artifacts:
- `docs/execplan-observance-sankalpa-feature.md`
- `docs/review-observance-sankalpa-feature.md`
- `docs/test-observance-sankalpa-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `feat(sankalpa): add observance date tracking`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results
