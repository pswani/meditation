# Reasoning-Effort Profiles

These profiles keep Codex effort proportional to the task instead of running every workflow at `high`.

## Profiles

### `pile-planning`

- reasoning effort: `high`
- use for:
  - pile intake
  - pile to group to bundle decomposition
  - pile README generation
  - group and bundle prompt generation

### `group-orchestration`

- reasoning effort: `high`
- use for:
  - running `prompts/run-group-workflow.md`
  - bundle sequencing decisions
  - shared-risk handling inside one group
  - deciding whether a bundle should stay in-thread or move to a separate thread

### `bundle-implementation`

- reasoning effort: `high`
- use for:
  - running `prompts/run-milestone-workflow.md`
  - implementation prompts
  - bundle-local review
  - failure diagnosis and fix planning

### `docs-and-cleanup`

- reasoning effort: `medium`
- use for:
  - durable docs updates
  - cleanup decisions
  - release-readiness summaries
  - closeout notes before merge

### `verification`

- reasoning effort: `low`
- use for:
  - lint, typecheck, test, and build command execution
  - raw output collection
  - deterministic reruns of verification scripts

### `cleanup`

- reasoning effort: `low`
- use for:
  - prompt-folder removal
  - branch cleanup
  - trace cleanup
  - other deterministic operator cleanup steps

## Escalation rule

Use this loop whenever a low-effort verification step fails:

1. run verification with `verification`
2. switch to `bundle-implementation` or `group-orchestration` to diagnose and fix
3. rerun the same verification with `verification`

## Default runner mappings

- `prompts/run-pile-planning-workflow.md` -> `pile-planning`
- `prompts/run-group-workflow.md` -> `group-orchestration`
- `prompts/run-milestone-workflow.md` -> `bundle-implementation`
- `90-group-review.md` -> `group-orchestration`
- `91-group-test.md` -> `verification`
- `92-group-build.md` -> `verification`
- `99-group-closeout.md` -> `docs-and-cleanup` unless the closeout is purely mechanical, in which case `cleanup` is acceptable

## CLI helper note

The repo-local helpers under `scripts/codex/` map these profile names to Codex CLI reasoning-effort overrides. By default they use the CLI config key `reasoning_effort`, and they allow an override through `CODEX_REASONING_CONFIG_KEY` in case the local CLI expects a different config path.
