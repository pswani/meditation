# Backend Test H2 Isolation ExecPlan

Date: 2026-04-17

## Objective

Harden the backend test and verification paths so automated checks do not write to the production-like file-backed H2 database, while preserving the current production runtime defaults.

## Why

- The backend default runtime intentionally uses a file-backed H2 database under `local-data/h2`, which is appropriate for local development and the production-style path.
- Contributors need stronger guarantees that automated verification uses isolated in-memory or disposable H2 storage instead of touching that persistent runtime path.
- The current repo already has partial safety measures, but the policy is implicit and unevenly documented.

## Scope

Included:
- backend test-profile configuration and focused configuration coverage
- verify-script hardening for disposable H2 runtime directories
- documentation updates for the safe verification flow
- only minimal helper or script changes needed to make the isolation contract explicit

Excluded:
- production runtime default changes in `backend/src/main/resources/application.yml`
- unrelated backend feature work
- native UI or frontend feature changes unrelated to verification safety
- destructive runtime reset flows

## Source documents

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
- `prompts/run-milestone-bundle.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/00-create-branch.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/01-implement-backend-test-h2-isolation.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/02-review-backend-test-h2-isolation.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/03-test-backend-test-h2-isolation.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/04-fix-backend-test-h2-isolation.md`
- `prompts/backend-test-h2-isolation-feature-bundle-with-branching/99-merge-branch.md`

## Affected files and modules

- `backend/src/test/resources/application-test.yml`
- focused backend configuration tests under `backend/src/test/java/com/meditation/backend/config/`
- `scripts/pipeline.sh`
- `scripts/common.sh`
- `README.md`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-backend-test-h2-isolation-feature.md`
- `docs/test-backend-test-h2-isolation-feature.md`

## UX behavior

- No user-facing app behavior should change.
- Contributor-facing verification behavior should become clearer and safer:
  - backend Spring tests should use isolated in-memory H2 by default
  - repo smoke verification should use disposable runtime and H2 directories
  - opt-in live integration paths should require explicit non-production configuration or skip when that safety is absent

## Data and state model

- Keep the default application datasource in `backend/src/main/resources/application.yml` pointed at the file-backed H2 path for normal local development and production-style runs.
- Keep automated backend test execution on an isolated datasource, with in-memory H2 preferred.
- Use disposable temp directories for any verification path that launches a real backend process.
- Prefer explicit environment variables and documented evidence over assuming contributors will infer which path is safe.

## Risks

- Over-hardening could accidentally change the default local-development runtime instead of only the verification surfaces.
- Script changes must clean up disposable temp directories reliably without broadening cleanup into destructive paths.
- Documentation changes need to stay aligned with the actual commands and environment variables the scripts use.

## Milestones

1. Capture the current state and identify every automated path that can initialize the backend.
2. Make the H2-isolation policy explicit in configuration and helper scripts.
3. Add or update focused configuration tests that prove the intended isolation behavior.
4. Update durable docs, review notes, and verification evidence.
5. Run the required verification flow and fix any gaps before merge.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
- `./scripts/pipeline.sh verify`
- focused evidence that the automated flow does not touch `local-data/h2`

## Decision log

- 2026-04-17: Use `codex/defects-enhancements-16Apr` as the required parent branch for this bundle.
- 2026-04-17: Keep the production-like file-backed H2 default in `backend/src/main/resources/application.yml`; this slice should harden tests and verification only.
- 2026-04-17: Current pre-implementation evidence:
  - `backend/src/main/resources/application.yml` points the default datasource at `jdbc:h2:file:${MEDITATION_H2_DB_DIR:../local-data/h2}/${MEDITATION_H2_DB_NAME:meditation}`
  - `backend/src/test/resources/application-test.yml` already points Spring tests at `jdbc:h2:mem:meditation-test`
  - `scripts/pipeline.sh` already launches the verify smoke backend with `mktemp` runtime and H2 directories plus `127.0.0.1:18080`
  - `docs/ios-native/README.md` documents the opt-in live native backend test behind `MEDITATION_NATIVE_LIVE_SYNC_BASE_URL`
- 2026-04-17: The repo is not yet fully explicit about this isolation policy, so continuing with the hardening slice is safer than stopping at doc clarification only.

## Progress log

- 2026-04-17: Read the bundle runner, bundle prompt files, and the required repo guidance.
- 2026-04-17: Inspected `backend/src/main/resources/application.yml`, `backend/src/test/resources/application-test.yml`, `backend/pom.xml`, `scripts/pipeline.sh`, `scripts/common.sh`, `docs/ios-native/README.md`, and the relevant README and current-state sections.
- 2026-04-17: Created branch `codex/backend-test-h2-isolation-feature-bundle-with-branching` from `codex/defects-enhancements-16Apr`.
- 2026-04-17: Confirmed the current worktree also contains unrelated untracked paths `.build/` and `scripts/install-iPhone.sh`; this slice will not modify or remove them.
- 2026-04-17: Updated `application-test.yml` to use unique in-memory H2 names plus a disposable temp media root, added focused config coverage, and hardened `./scripts/pipeline.sh verify` to use disposable runtime, H2, and media directories with visible evidence output.
- 2026-04-17: Completed the required verification flow:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
  - `./scripts/pipeline.sh verify`
- 2026-04-17: Confirmed the automated flow left `local-data/h2` untouched by comparing directory and file mtimes before and after `./scripts/pipeline.sh verify`.
