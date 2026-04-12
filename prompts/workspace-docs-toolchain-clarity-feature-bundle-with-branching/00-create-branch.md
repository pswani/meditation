# Create Branch: Workspace Docs Toolchain Clarity

Objective:
- prepare a safe feature branch for a bounded docs and tooling clarity slice covering the repo map, supported environments, and iOS package or project metadata

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
- `prompts/expert-review-remediation-phased-plan.md`

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer base.
3. Create and switch to `codex/workspace-docs-toolchain-clarity-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-workspace-docs-toolchain-clarity-feature.md`
- Review doc: `docs/review-workspace-docs-toolchain-clarity-feature.md`
- Test doc: `docs/test-workspace-docs-toolchain-clarity-feature.md`

Bundle scope reminder:
- make the README a trustworthy map of the real workspace
- remove absolute local paths and stale repo-layout guidance
- pin and document the supported toolchain and environment expectations
- clarify the canonical iOS workflow between the Swift package and the Xcode project
- separate general developer guidance from macOS-only operational scripts

Stop and escalate if:
- the repo contains multiple intentionally supported toolchain variants that cannot be reconciled safely in one bundle
- iOS package metadata changes would break a workflow that is clearly still canonical but undocumented
- the required docs contradict one another in a way that needs new product input rather than cleanup

When complete:
- report the parent branch, feature branch, and the three planned doc paths above
- then continue to `01-implement-workspace-docs-toolchain-clarity.md`
