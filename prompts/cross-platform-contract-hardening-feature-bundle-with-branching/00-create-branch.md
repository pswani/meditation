# Create Branch: Cross-Platform Contract Hardening

Objective:
- prepare a safe feature branch for a bounded contract-hardening slice covering sync semantics, stale-write handling, shared reference data, and transaction discipline across backend, web, and iOS

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
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/execplan-offline-app-sync-feature.md`
- `docs/review-offline-app-sync-feature.md`
- `docs/test-offline-app-sync-feature.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer base.
3. Create and switch to `codex/cross-platform-contract-hardening-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-cross-platform-contract-hardening-feature.md`
- Review doc: `docs/review-cross-platform-contract-hardening-feature.md`
- Test doc: `docs/test-cross-platform-contract-hardening-feature.md`

Bundle scope reminder:
- define one canonical sync contract for queued mutations, stale writes, and conflict outcomes
- standardize stale-mutation HTTP semantics and response shapes
- establish one source of truth for shared reference data or API schema
- audit transaction boundaries on multi-step write paths
- add cross-platform integration coverage for conflict and replay cases

Stop and escalate if:
- backward-compatibility requirements across web and iOS cannot be preserved without a broader migration plan
- the repo already contains another canonical schema system that conflicts with this bundle's direction
- the contract work expands into a full rewrite of runtime orchestration instead of a bounded hardening slice

When complete:
- report the parent branch, feature branch, and the three planned doc paths above
- then continue to `01-implement-cross-platform-contract-hardening.md`
