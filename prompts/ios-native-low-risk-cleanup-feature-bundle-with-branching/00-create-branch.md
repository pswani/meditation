# Create Branch: iOS Native Low-Risk Cleanup

Objective:
- prepare a safe feature branch for small native cleanup work that should be low-risk and easy to review

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
3. Create and switch to `codex/ios-native-low-risk-cleanup-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-ios-native-low-risk-cleanup-feature.md`
- Review doc: `docs/review-ios-native-low-risk-cleanup-feature.md`
- Test doc: `docs/test-ios-native-low-risk-cleanup-feature.md`

Bundle scope reminder:
- close small, low-risk cleanup items that remain after the larger parity bundles
- prefer project hygiene, warning cleanup, documentation polish, and narrowly scoped code-quality improvements

Stop and escalate if:
- a proposed cleanup changes user-facing behavior in a meaningful way
- the work starts turning into a hidden feature bundle or broad refactor

When complete:
- report the parent branch, feature branch, and the exact output doc paths above
- then continue to `01-implement-ios-native-low-risk-cleanup.md`
