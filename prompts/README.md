# Codex milestone prompt bundle

This bundle sets up a foundation phase and milestone-by-milestone implementation flow for a full-stack meditation app:

- React front end
- clean REST APIs between front end and back end
- H2 database for back end persistence
- static sound/media files stored on disk, with file paths referenced in the database

## Expected repo shape

Place these folders at the repo root:

- `.codex/`
- `prompts/`
- `scripts/`

## High-level execution order

1. `prompts/foundation/01-lock-ux-baseline.md`
2. `prompts/foundation/02-solidify-fullstack-architecture.md`
3. `prompts/foundation/03-qa-build-test-baseline.md`

Then run Milestone A, then B, then C, then D.

## Milestone structure

Each milestone includes:
- implementation prompts
- review prompts
- fix prompts
- test / QA prompts

This is intentional so quality does not get deferred until the end.

## Backend preferences encoded into the prompts

The milestone prompts explicitly assume:
- H2 database for persistence
- media/sound files stored in a server-side directory with filesystem paths stored in the database
- REST-style API contracts between front end and back end
- responsive UX across mobile, tablet, and desktop

## Reasoning profile

This bundle includes a `.codex/config.toml` profile named `deep-build` with high reasoning effort.

## Runner

Use:

```bash
chmod +x scripts/run-milestones.sh
./scripts/run-milestones.sh
```

Or run prompts one by one.
