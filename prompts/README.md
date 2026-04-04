# Prompt Bundles

This folder stores reusable Codex prompt bundles when a new bounded milestone needs a structured implementation workflow.

Current status:

- No active bundle folders are present right now because the previously tracked bundles in this directory have already been implemented and cleaned up.
- Bundle history remains in Git history and in the durable docs under `requirements/` and `docs/`.

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
