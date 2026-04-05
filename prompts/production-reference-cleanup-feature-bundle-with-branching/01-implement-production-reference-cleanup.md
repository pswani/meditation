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
- Remove configuration drift, duplicated reference definitions, and generated-artifact clutter so the repo feels cleaner and more production-grade to maintain and operate.

Required planning step:
1. Create and keep updated an ExecPlan at `docs/execplan-production-reference-cleanup-feature.md` before making substantial code changes.
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
1. Establish one authoritative approach for shared reference values such as meditation types, `session log` sources, and time-of-day buckets across frontend and backend.
2. Keep database seed and backend validation behavior aligned with that chosen source of truth.
3. Remove the duplicate Vite config and retain one documented, authoritative config path.
4. Make README and any relevant durable docs accurately reflect actual Vite, proxy, and runtime behavior.
5. Stop tracking generated build metadata such as `tsconfig.node.tsbuildinfo`, and confirm ignore rules and repo hygiene protect against similar artifacts.
6. Add or tighten one repeatable verification entrypoint that covers frontend verification, backend verification or packaging, and at least one smoke-style local check through repo scripts where practical.
7. Do not widen into media ownership cleanup or cache-version redesign in this phase.

Suggested implementation direction:
- Prefer a reference-data approach that keeps terminology exact and avoids duplicate hand-maintained string lists.
- Keep the operator workflow production-first and consistent with the existing pipeline direction in `requirements/decisions.md`.
- If a repo script becomes the single verify entrypoint, make it explicit, documented, and easy to rerun locally.

Expected affected areas:
- reference-data definitions under `src/` and `backend/`
- `backend/src/main/resources/db/migration/`
- `vite.config.ts` or `vite.config.js`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `.gitignore`
- `package.json`
- repo scripts used for verification

Required tests:
- Add or update focused tests for any shared reference-data loading or validation changes.
- Add or update tests for config or verification wrappers where practical.
- Preserve existing behavior tests that rely on shared product terminology or validation sets.

Documentation updates:
- Update `README.md` for the final config and verify workflow.
- Update `docs/architecture.md` if the durable configuration model changes.
- Update `requirements/decisions.md` for long-lived reference-data or verification-workflow decisions.
- Update `requirements/session-handoff.md` for the new repo state, artifact paths, and recommended next slice.

Verification after implementation:
- run the new or tightened single-entry verification command
- if that command does not fully cover every required check yet, also run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Suggested durable artifacts:
- `docs/execplan-production-reference-cleanup-feature.md`
- `docs/review-production-reference-cleanup-feature.md`
- `docs/test-production-reference-cleanup-feature.md`

Commit expectations:
- Use a focused commit message in the repo's preferred style, such as:
  - `chore(prod): clean reference data and verify workflow`

Deliverables before moving on:
- coherent ExecPlan
- implementation changes
- updated tests
- updated durable docs
- verification results

