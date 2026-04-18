# Staged Prompt Workflows

This folder stores the reusable runners, reasoning profiles, generated pile folders, and any explicitly requested staged workflow artifacts for bounded implementation work.

## Current contents

- `run-pile-planning-workflow.md`
- `run-group-workflow.md`
- `run-milestone-workflow.md`
- `reasoning-effort-profiles.md`
- `piles/README.md`
- `README.md`

There are currently no retained generated pile folders or phased-plan files in this worktree.

## Workflow layers

- `Pile`: the full batch on one integration branch
- `Group`: the main execution and verification unit
- `Bundle`: the implementation unit inside one group

## When to add a staged workflow

Create staged workflow artifacts under `prompts/` only when the user explicitly wants a reusable or generated staged workflow.

1. Plan the pile under `prompts/piles/<pile-name>/`.
2. Create one folder per group under that pile.
3. Create one folder per bundle under each group.
4. Keep bundle folders named as domain use cases in the form `<domain>-<use-case>`.
5. Default bundle folders to 2-4 implementation prompts before their local review, test, and fix prompts.
6. Add the group-level files unless there is a justified deviation:
   - `README.md`
   - `00-group-plan.md`
   - `90-group-review.md`
   - `91-group-test.md`
   - `92-group-build.md`
   - `99-group-closeout.md`
7. Add the bundle-level files unless there is a justified deviation:
   - `00-create-branch.md`
   - `01-implement-*.md`
   - `02-implement-*.md`
   - `03-implement-*.md`
   - `04-review-*.md`
   - `05-test-*.md`
   - `06-fix-*.md`
   - `99-merge-branch.md`
8. Keep all prompt guidance aligned with `AGENTS.md`, `PLANS.md`, `docs/codex-staged-workflow-design.md`, and the durable requirements docs.
9. Remove the generated pile folder after the work is done unless the user explicitly wants to retain it.

## Reusable runners

- `run-pile-planning-workflow.md`: generate or refresh one pile, its groups, and its bundles
- `run-group-workflow.md`: execute one group and its group-level gates
- `run-milestone-workflow.md`: execute one bundle in isolation

## Reasoning profiles

Use the mappings in `reasoning-effort-profiles.md` and the helper scripts under `scripts/codex/` to keep reasoning effort proportional to the task.
