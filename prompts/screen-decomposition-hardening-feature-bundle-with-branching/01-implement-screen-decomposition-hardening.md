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
- `prompts/production-grade-hardening-phased-plan.md`

Implementation objective:
- Reduce the size and maintenance risk of the remaining oversized frontend screens and managers without changing the product experience.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-screen-decomposition-hardening-feature.md` before making substantial code changes.
2. Use that ExecPlan to record:
   - objective
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
1. Decompose the remaining oversized modules into smaller presentational components, hooks, and pure helpers where that improves readability and testability.
2. Keep business logic out of large JSX trees and keep domain naming aligned with the existing product terminology.
3. Preserve current behavior for Home, Practice, Goals, Settings, custom plays, playlists, and shell messaging.
4. Preserve calm multi-device UX across phone, tablet, and desktop layouts.
5. If a previously targeted file is already sufficiently reduced by earlier phases, record that in the ExecPlan and focus on the remaining hotspots rather than forcing extra churn.
6. Do not widen into backend or operational cleanup already covered by earlier bundles.

Suggested implementation direction:
- Prefer extracting small, clearly named modules over creating new mega-components.
- Keep shared presentation in `src/components` when it is genuinely reusable.
- Keep feature-specific logic in `src/features` and route composition in `src/pages`.
- Extract domain helpers when a screen currently mixes rendering with validation, filtering, or orchestration logic.

Expected affected areas:
- `src/pages/SankalpaPage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/playlists/PlaylistManager.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/HomePage.tsx`
- `src/app/AppShell.tsx`
- any new smaller components, hooks, or helpers introduced by the decomposition

Required tests:
- Add or update focused tests for extracted helpers, hooks, or components.
- Preserve or improve behavior coverage for the touched screens and managers.
- Avoid shallow tests that do not protect the real interaction paths.

Documentation updates:
- Update `docs/architecture.md` if the durable frontend module structure changes materially.
- Update `docs/ux-spec.md` or `docs/screen-inventory.md` only if user-facing behavior or terminology changes in a durable way.
- Update `requirements/decisions.md` for any long-lived decomposition or module-ownership decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification only if this phase changes backend code or contracts

Suggested durable artifacts:
- `docs/execplan-screen-decomposition-hardening-feature.md`
- `docs/review-screen-decomposition-hardening-feature.md`
- `docs/test-screen-decomposition-hardening-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `refactor(ui): split oversized screen modules`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results

