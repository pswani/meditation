# Production Reference Cleanup ExecPlan

Date: 2026-04-05

## Objective

Remove reference-data drift, configuration duplication, and generated-artifact clutter so the repository is cleaner to maintain and the operator verification path is more production-grade.

## Why

- Shared product vocabularies such as meditation types, `session log` sources, and time-of-day buckets are still duplicated across multiple frontend and backend modules.
- Both `vite.config.ts` and `vite.config.js` are tracked even though only one should be authoritative.
- The durable docs currently describe conflicting Vite and proxy behavior.
- `tsconfig.node.tsbuildinfo` is still tracked even though generated build metadata should stay out of version control.
- `./scripts/pipeline.sh verify` is documented as the unified quality gate, but it currently stops at frontend checks and does not cover backend verification or a smoke-style health check.

## Scope

Included:
- one authoritative frontend reference-data module for meditation types, `session log` sources, and time-of-day buckets
- one authoritative backend reference-data module for the same shared vocabularies
- backend seed-alignment coverage for meditation-type reference data
- one authoritative Vite config file with documented local proxy behavior
- generated-artifact cleanup for tracked TypeScript build metadata
- one repeatable verification entrypoint that covers frontend checks, backend verification, and a temporary backend health smoke check
- durable documentation updates for config and verification behavior

Excluded:
- backend query redesign
- media ownership cleanup
- service-worker cache version changes
- large UI refactors
- broad runtime decomposition outside the affected validation and config surfaces

## Source documents

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
- `prompts/production-reference-cleanup-feature-bundle-with-branching/00-create-branch.md`
- `prompts/production-reference-cleanup-feature-bundle-with-branching/01-implement-production-reference-cleanup.md`

## Affected files and modules

- `src/types/`
- `src/features/timer/constants.ts`
- `src/utils/storage/shared.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/summary.ts`
- `src/utils/summaryApi.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `backend/src/main/java/com/meditation/backend/reference/`
- backend service classes that validate or order shared reference values
- `backend/src/test/java/com/meditation/backend/reference/`
- `vite.config.ts`
- `vite.config.js`
- `tsconfig.node.json`
- `scripts/pipeline.sh`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## UX behavior

- Product terminology must remain exactly the same:
  - meditation types stay `Vipassana`, `Ajapa`, `Tratak`, `Kriya`, `Sahaj`
  - `session log` sources stay `auto log` and `manual log`
  - time-of-day buckets stay `morning`, `afternoon`, `evening`, `night`
- History, summary, and sankalpa filters must continue to render and validate those values without user-visible drift.
- No screen redesign is planned in this slice.
- The verification workflow should become easier to rerun and document, not more operator-specific or confusing.

## Data and state model

- Frontend shared reference values should live in one stable module instead of multiple repeated arrays and sets.
- Backend shared reference values should live in one stable module inside the reserved `reference` package instead of repeated service-local `Set.of(...)` definitions.
- The H2 seed for meditation-type reference rows should stay aligned with backend validation order through an automated test.
- The supported local verification entrypoint should remain script-driven and production-first.

## Risks and tradeoffs

- Cross-language literal sharing between frontend and backend is not practical to introduce deeply in this bounded slice, so the cleanup should centralize definitions per runtime layer and add alignment coverage instead of inventing code generation.
- Restoring dev proxy behavior in the surviving Vite config must stay clearly documented as local-development-only behavior so it is not confused with the production nginx path.
- Expanding `pipeline.sh verify` to include a smoke check must avoid leaving background processes behind or colliding with an already-running backend.

## Milestones

1. Create the ExecPlan and inspect current reference-data, config, ignore, and verify surfaces.
2. Centralize frontend and backend shared reference vocabularies and update validators/ordering logic to use them.
3. Remove the duplicate Vite config and align the surviving config with documented local proxy behavior.
4. Clean generated-artifact tracking and expand the unified verify script to include backend verify plus a smoke check.
5. Add focused tests for reference-data and seed/config behavior.
6. Update durable docs and run verification.

## Verification

- `./scripts/pipeline.sh verify`
- if needed in addition:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Focused checks:
- shared reference-data validation remains correct in frontend API boundaries and backend services
- the surviving Vite config is the only authoritative config file and matches documented proxy behavior
- `tsconfig.node.tsbuildinfo` is no longer tracked
- the unified verify entrypoint successfully covers frontend, backend, and smoke behavior

## Decision log

- 2026-04-05: Use `codex/cleanup` as the parent because it already contains the runtime-boundary and backend-scale merges required by this phase.
- 2026-04-05: Keep this slice bounded to reference/config/verification cleanup rather than pulling in later media or cache-ownership work.
- 2026-04-05: Favor one central module per runtime layer plus alignment tests over introducing cross-language code generation for shared reference values.
- 2026-04-05: Keep `vite.config.ts` as the only Vite config and retain a local-development-only `/api` proxy there instead of reviving duplicate config files.
- 2026-04-05: Move node-side TypeScript build outputs under ignored `local-data/tsbuild/` so config compilation does not recreate tracked root artifacts.

## Progress log

- 2026-04-05: Read the milestone runner, production-reference bundle prompts, and required repo/product docs.
- 2026-04-05: Created branch `codex/production-reference-cleanup-feature-bundle-with-branching` from `codex/cleanup`.
- 2026-04-05: Confirmed current drift points:
  - duplicated frontend and backend reference-value definitions
  - duplicate tracked Vite configs
  - contradictory README statements about local proxy behavior
  - tracked `tsconfig.node.tsbuildinfo`
  - `./scripts/pipeline.sh verify` covering frontend checks only
- 2026-04-05: Added shared frontend and backend reference-data modules, removed the duplicate meditation-types JSON, aligned backend validation/order logic, and added reference-data tests including backend seed alignment.
- 2026-04-05: Removed the duplicate Vite config, redirected node-side TypeScript build outputs into ignored `local-data/tsbuild/`, and tightened `./scripts/pipeline.sh verify` to cover frontend checks, backend Maven verify, and a temporary backend health smoke check.
- 2026-04-05: Verified the final slice through `./scripts/pipeline.sh verify`, including frontend typecheck/lint/test/build, backend `mvn verify`, and a passing temporary backend health check on `http://127.0.0.1:18080/api/health`.
