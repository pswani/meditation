# Prompt Bundles

This folder stores reusable Codex prompt bundles when a new bounded milestone needs a structured implementation workflow.

Current status:

- Bundle folder currently available in-repo:
  - `backend-scale-hardening-feature-bundle-with-branching`
  - `history-time-gap-rendering-fix-bundle-with-branching`
  - `media-cache-hygiene-feature-bundle-with-branching`
  - `offline-app-sync-feature-bundle-with-branching`
  - `production-reference-cleanup-feature-bundle-with-branching`
  - `runtime-boundary-hardening-feature-bundle-with-branching`
  - `screen-decomposition-hardening-feature-bundle-with-branching`
- Older bundle history remains in Git history and in the durable docs under `requirements/` and `docs/`.

Phased planning files currently available in-repo:

- `production-grade-hardening-phased-plan.md`

Reusable runner template:

- `run-milestone-bundle.md`

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
