# 00 Create Branch

Bundle: `backend-test-h2-isolation-feature-bundle-with-branching`

Goal: harden the repo’s testing and verification setup so tests do not update the production H2 database, with in-memory or disposable H2 usage preferred wherever practical.

Before branching:
- Read `AGENTS.md`, `PLANS.md`, `README.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Inspect the current verification and runtime surfaces:
  - `backend/src/main/resources/application.yml`
  - `backend/src/test/resources/application-test.yml`
  - `backend/pom.xml`
  - `scripts/pipeline.sh`
  - `scripts/common.sh`
  - `docs/ios-native/README.md`
  - `README.md`
- Create an ExecPlan at `docs/execplan-backend-test-h2-isolation-feature.md`.
- Reserve the review and test outputs:
  - `docs/review-backend-test-h2-isolation-feature.md`
  - `docs/test-backend-test-h2-isolation-feature.md`

Branching steps:
1. Use `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
2. Create `codex/backend-test-h2-isolation-feature-bundle-with-branching`.
3. Record the parent branch and current test-runtime evidence in the ExecPlan.

Stop and realign if:
- the current repo already guarantees isolation for the exact user concern and only needs doc clarification
- the desired safety change would alter production runtime defaults instead of test-only behavior

Then continue with `01-implement-backend-test-h2-isolation.md`.
