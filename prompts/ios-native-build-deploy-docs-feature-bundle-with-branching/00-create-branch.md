# Create Branch: iOS Native Build Deploy And Docs

Objective:
- prepare a safe feature branch for the operator workflow and documentation slice

Read before doing any work:
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
- `docs/ios-native/README.md`
- `docs/ios-native/parity-review-2026-04-10.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer parent.
3. Create and switch to `codex/ios-native-build-deploy-docs-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-ios-native-build-deploy-docs-feature.md`
- Review doc: `docs/review-ios-native-build-deploy-docs-feature.md`
- Test doc: `docs/test-ios-native-build-deploy-docs-feature.md`

Bundle scope reminder:
- scripted build and deploy workflow for simulator and connected iPhone
- consolidated iOS README and operator guidance
- documentation refresh tied to the new workflow

Stop and escalate if:
- physical-device deployment requires credentials, provisioning, or tooling that cannot be derived safely from the repo and local machine state
- the proposed script would need unsupported destructive behavior

When complete:
- report the parent branch, feature branch, and the exact output doc paths above
- then continue to `01-implement-ios-native-build-deploy-docs.md`
