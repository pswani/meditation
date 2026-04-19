# Sankalpa Activity Tracking Gym Goal Pile

Integration branch: `codex/integration-sankalpa-activity-tracking-gym-goal`

This pile is a staged workflow for Sankalpa activity tracking, a gym-style observance sankalpa, and the focused timer defect where the ending bell does not play when the app is not in focus. These are planning artifacts only; product code should be implemented later by running the generated group prompts.

## Source Brief

See `prompts/piles/sankalpa-activity-tracking-gym-goal/pile-brief.md`.

## Execution Order

1. `01-sankalpa-activity-gym-goal`
   - Goal: Extend the Sankalpa product area so active sankalpas can show calm daily activity evidence and can represent going to the gym 5 times a week for 4 weeks as an observance-style sankalpa.
   - Dependency notes: Run first because it may need a narrow Sankalpa model/API/cache enhancement that later tracking UI depends on.
2. `02-timer-background-end-bell`
   - Goal: Fix or materially improve the ending bell behavior when the timer completes while the app is not focused, within honest web-platform limits.
   - Dependency notes: Independent of the Sankalpa group and safe to run after group 1.

## Exact Group Prompts

### Group 1: Sankalpa Activity Gym Goal

Paste this into a new Codex UI thread:

```text
Read prompts/run-group-workflow.md and execute it for prompts/piles/sankalpa-activity-tracking-gym-goal/01-sankalpa-activity-gym-goal using codex/integration-sankalpa-activity-tracking-gym-goal as the parent git branch.
```

Preferred helper command:

```bash
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 01-sankalpa-activity-gym-goal codex/integration-sankalpa-activity-tracking-gym-goal
```

Useful phase reruns:

```bash
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 01-sankalpa-activity-gym-goal codex/integration-sankalpa-activity-tracking-gym-goal review
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 01-sankalpa-activity-gym-goal codex/integration-sankalpa-activity-tracking-gym-goal test
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 01-sankalpa-activity-gym-goal codex/integration-sankalpa-activity-tracking-gym-goal build
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 01-sankalpa-activity-gym-goal codex/integration-sankalpa-activity-tracking-gym-goal closeout
```

### Group 2: Timer Background End Bell

Paste this into a new Codex UI thread:

```text
Read prompts/run-group-workflow.md and execute it for prompts/piles/sankalpa-activity-tracking-gym-goal/02-timer-background-end-bell using codex/integration-sankalpa-activity-tracking-gym-goal as the parent git branch.
```

Preferred helper command:

```bash
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 02-timer-background-end-bell codex/integration-sankalpa-activity-tracking-gym-goal
```

Useful phase reruns:

```bash
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 02-timer-background-end-bell codex/integration-sankalpa-activity-tracking-gym-goal review
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 02-timer-background-end-bell codex/integration-sankalpa-activity-tracking-gym-goal test
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 02-timer-background-end-bell codex/integration-sankalpa-activity-tracking-gym-goal build
./scripts/codex/run-group.sh sankalpa-activity-tracking-gym-goal 02-timer-background-end-bell codex/integration-sankalpa-activity-tracking-gym-goal closeout
```

## Reasoning Guidance

Use `prompts/reasoning-effort-profiles.md`:

- `pile-planning` for maintaining this pile.
- `group-orchestration` for `prompts/run-group-workflow.md`, group review, and implementation sequencing.
- `bundle-implementation` for each bundle prompt and any failure diagnosis.
- `verification` for deterministic typecheck, lint, test, and build runs.
- `docs-and-cleanup` for closeout and durable docs.
- `cleanup` for final prompt-folder removal.

## Cleanup Before Main

These generated pile folders are temporary operator workflow artifacts. Before merging the integration branch to `main`, remove `prompts/piles/sankalpa-activity-tracking-gym-goal/` unless the user explicitly asks to retain it. Fold durable outcomes into `README.md`, `docs/`, `requirements/decisions.md`, and `requirements/session-handoff.md` instead of preserving prompt history on `main`.
