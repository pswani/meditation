# Prompt Bundles

This folder stores the reusable runner plus any explicitly requested prompt bundles for bounded milestone work.

## Current contents

- `run-milestone-bundle.md`
- `README.md`

There are currently no retained prompt-bundle folders or phased-plan files in this worktree.

## When to add a new bundle

Create a new bundle under `prompts/` only when the user explicitly wants a reusable, staged workflow.

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
5. Remove the bundle from the worktree after the work is done unless there is a clear reason to keep it.
