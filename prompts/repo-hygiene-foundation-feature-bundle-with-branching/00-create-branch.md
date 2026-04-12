# Create Branch: Repo Hygiene Foundation

Objective:
- prepare a safe feature branch for a bounded repo-hygiene slice focused on generated artifacts, mutable runtime state, and ambiguous tracked build output

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

Branching instructions:
1. Inspect the current branch and working tree with non-destructive git commands.
2. Use the current branch as the default parent unless repo state clearly indicates a safer base.
3. Create and switch to `codex/repo-hygiene-foundation-feature-bundle-with-branching`.
4. Preserve unrelated local changes.

Planning outputs to establish up front:
- ExecPlan: `docs/execplan-repo-hygiene-foundation-feature.md`
- Review doc: `docs/review-repo-hygiene-foundation-feature.md`
- Test doc: `docs/test-repo-hygiene-foundation-feature.md`

Bundle scope reminder:
- audit current tracked generated, built, deployed, cache, and OS-noise artifacts before removing anything
- tighten the root `.gitignore` or equivalent ignore surface instead of assuming it is missing
- make `local-data/` an untracked runtime area except for intentionally versioned fixtures, templates, or setup helpers
- keep one canonical Vitest config and remove tracked generated config output or build metadata
- add or update reproducible setup/reset documentation or scripts where needed to replace removed mutable state

Stop and escalate if:
- the cleanup would delete user-authored source, fixtures, or operator-owned assets without a clear replacement
- current repo state materially contradicts the review findings in a way that changes the intended scope
- required setup scripts would become destructive to non-local data

When complete:
- report the parent branch, feature branch, and the three planned doc paths above
- then continue to `01-implement-repo-hygiene-foundation.md`
