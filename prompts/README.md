# Prompt Bundles

This folder stores reusable Codex prompt bundles when a new bounded milestone needs a structured implementation workflow.

Current status:

- Bundle folders currently available in-repo:
  - `ios-native-runtime-device-defects-feature-bundle-with-branching`
  - `repo-hygiene-foundation-feature-bundle-with-branching`
  - `workspace-docs-toolchain-clarity-feature-bundle-with-branching`
  - `cross-platform-contract-hardening-feature-bundle-with-branching`
  - `runtime-boundary-decomposition-feature-bundle-with-branching`
  - `media-surface-and-ci-hardening-feature-bundle-with-branching`
- Older bundle history remains in Git history and in the durable docs under `requirements/` and `docs/`.

Phased planning files currently available in-repo:

- `production-grade-hardening-phased-plan.md`
- `expert-review-remediation-phased-plan.md`
- `ios-native-app-phased-plan.md`
- `ios-native-parity-gap-phased-plan.md`
- `ios-native-review-followup-phased-plan.md`

Reusable runner template:

- `run-milestone-bundle.md`

Additional usage guide:

- `ios-native-app-step-by-step.md`

When creating the next bundle:

1. Create a new folder under `prompts/` using a clear milestone-oriented name.
2. Add a bounded prompt sequence in sorted order.
3. Include the standard lifecycle steps unless there is a justified deviation:
   - `00-create-branch.md`
   - `01-implement-*.md`
   - `02-review-*.md`
   - `03-test-*.md`
   - `04-fix-*.md`
   - `99-merge-branch.md`
4. Keep all prompt guidance aligned with `AGENTS.md`, `PLANS.md`, and the durable requirements docs.
