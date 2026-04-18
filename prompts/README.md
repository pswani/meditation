# Staged Prompt Workflows

This folder stores the reusable runner plus any explicitly requested staged prompt folders for bounded milestone work.

## Current contents

- `run-milestone-workflow.md`
- `README.md`

There are currently no retained staged prompt folders or phased-plan files in this worktree.

## When to add a new staged prompt folder

Create a new staged prompt folder under `prompts/` only when the user explicitly wants a reusable, staged workflow.

1. Create a new folder under `prompts/` named as a domain use case in the form `<domain>-<use-case>`.
2. Keep the folder focused on one meaningful vertical slice and one real user journey.
3. Add a bounded prompt sequence in sorted order.
4. Include the standard lifecycle steps unless there is a justified deviation:
   - `00-create-branch.md`
   - `01-implement-*.md`
   - `02-implement-*.md`
   - `03-implement-*.md`
   - `04-review-*.md`
   - `05-test-*.md`
   - `06-fix-*.md`
   - `99-merge-branch.md`
5. Default to 2-4 implementation prompts before the consolidated review, test, and fix prompts.
6. Prefer folder names such as `timer-active-session`, `playlist-guided-run`, or `session-log-manual-entry`.
7. Avoid packaging or layer-oriented names such as `*-bundle`, `phase-*`, `ui-*`, or `api-*`.
8. Keep all prompt guidance aligned with `AGENTS.md`, `PLANS.md`, and the durable requirements docs.
9. Remove the staged prompt folder from the worktree after the work is done unless there is a clear reason to keep it.
