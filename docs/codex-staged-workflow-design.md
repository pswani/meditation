# Codex Staged Workflow Design

This document defines the repository's preferred AI-assisted delivery model for mixed piles of features, enhancements, and defect fixes.

## Objective

Turn one mixed pile of work into a staged workflow that:

- preserves healthy implementation chunks
- reduces repeated review and verification overhead
- makes Codex execution predictable across UI threads and CLI runs
- keeps temporary workflow artifacts out of `main`

## Delivery model

Use this hierarchy:

```text
Pile
-> Group
-> -> Bundle
```

Definitions:

- `Pile`: the full batch intended to land through one integration branch
- `Group`: the main execution and verification unit
- `Bundle`: the implementation unit inside a group

Use `Bundle` as the planning term, but name actual bundle folders as domain use cases such as `session-log-edit-manual-entry` or `history-filter-refinement`.

## Branch strategy

- Create one integration branch per pile.
- Create one child branch per bundle from that integration branch.
- Merge completed bundle branches back into the integration branch.
- Run group-level review, test, and build gates after all bundles in a group are complete.
- Remove pile folders, generated group folders, task-specific ExecPlans, and execution traces from the integration branch before merging to `main`.
- Merge the cleaned integration branch to `main` only after final manual validation is complete.

## Thread model

- Default to one Codex UI thread per group.
- Run multiple related bundles in one thread when they are sequential, tightly related, and share meaningful context.
- Split a bundle into its own thread only when it is large, risky, mostly independent, or likely to clutter the shared group context.
- Do not execute an entire pile in one thread.

## Reasoning-effort model

Use reasoning effort intentionally instead of running every phase at `high`.

- `high`:
  - pile intake analysis
  - pile to group to bundle decomposition
  - ExecPlan design
  - bundle implementation
  - code review
  - failure diagnosis
  - fix planning
- `medium`:
  - docs updates
  - cleanup decisions
  - release-readiness summaries
  - merge-readiness checks
- `low`:
  - deterministic verification commands
  - lint, typecheck, test, and build command execution
  - output collection
  - prompt-folder cleanup
  - branch cleanup

Escalation rule:

1. run verification at `low`
2. if verification fails, switch to `high` to diagnose and fix
3. rerun verification at `low`

## Prompt structure

Reusable prompt runners live directly under `prompts/`.

Generated workflow artifacts live under:

```text
prompts/piles/<pile-name>/
  README.md
  pile-brief.md
  <group-name>/
    README.md
    00-group-plan.md
    <bundle-name-1>/
      00-create-branch.md
      01-implement-*.md
      02-implement-*.md
      03-implement-*.md
      04-review-*.md
      05-test-*.md
      06-fix-*.md
      99-merge-branch.md
    <bundle-name-2>/
    90-group-review.md
    91-group-test.md
    92-group-build.md
    99-group-closeout.md
```

### Pile contract

`prompts/piles/<pile-name>/README.md` should include:

- the integration branch name
- the group execution order
- one-line goal and dependency notes for each group
- the exact prompt to paste into a new Codex UI thread for each group
- the preferred CLI helper command for each group
- final cleanup and merge instructions

### Group contract

Each group folder should include:

- `README.md`:
  - group goal
  - bundle order
  - thread strategy
  - shared docs or ExecPlan expectations
  - group-level verification commands
- `00-group-plan.md`:
  - scope
  - bundle order and dependencies
  - risks
  - shared validation and build gates
- `90-group-review.md`, `91-group-test.md`, `92-group-build.md`, `99-group-closeout.md` for consolidated group-level gates

### Bundle contract

Each bundle should:

- represent one real vertical slice
- use a domain use-case folder name
- default to 2-4 `implement` prompts before its local review, test, and fix prompts
- stay scoped to the bundle branch and the integration branch named in the enclosing group docs

## Reusable runners

The repo keeps three reusable prompt runners:

- `prompts/run-pile-planning-workflow.md`
- `prompts/run-group-workflow.md`
- `prompts/run-milestone-workflow.md`

Preferred usage:

- use `run-pile-planning-workflow.md` to turn a pile brief into pile, group, and bundle prompt folders
- use `run-group-workflow.md` to execute a group end to end
- use `run-milestone-workflow.md` to execute one bundle in isolation when a separate thread is the better choice

## Repo-local CLI helpers

Repo-local helper scripts live under `scripts/codex/`.

The helpers should:

- construct the exact prompt text used by the reusable runners or generated group files
- map repo-defined reasoning profiles to Codex CLI config overrides
- make it easy to print the command or execute it directly
- keep prompt files, not shell scripts, as the source of truth

## Cleanup rule

Temporary workflow artifacts should not land on `main` unless the user explicitly asks to preserve them.

Before merging the integration branch to `main`, remove:

- `prompts/piles/<pile-name>/`
- task-specific ExecPlans that no longer carry durable value
- execution traces, review scratch files, and other temporary operator artifacts

Keep durable outcomes in:

- `README.md`
- `AGENTS.md`
- `docs/`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- code, tests, and scripts that remain part of the product or operator workflow

## Example operator flow

1. create `codex/integration-2026-04-18-defects-enhancements`
2. create `prompts/piles/defects-enhancements-2026-04-18/pile-brief.md`
3. run the pile-planning workflow to generate groups and bundles
4. execute each group in order
5. after each group completes, run group review, test, and build gates
6. remove temporary workflow artifacts from the integration branch
7. validate backend, web, and iOS manually from the cleaned integration branch
8. merge to `main`
9. delete child branches and then the integration branch
