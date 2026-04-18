# Current State

This file is the concise handoff for the repository as it exists now. Use it as a pointer to the stable docs, not as a running transcript.

## Repository truth

- The repo is a working full-stack meditation application with:
  - a React + TypeScript + Vite frontend
  - a Spring Boot backend in `backend/`
  - H2 persistence plus Flyway migrations
  - offline-first queue-backed behavior for implemented backend-backed domains
  - native iPhone work under `ios-native/`
- Primary product journeys now exist across Home, Practice, History, Goals, and Settings.
- Implemented domains include timer sessions, `custom play`, playlists, automatic and manual `session log` flows, summaries, and `sankalpa`.

## Durable docs to read first

- `README.md`
- `docs/README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`

## Documentation layout

- Stable product and operator docs stay at the top level of `docs/`.
- Native-specific durable guidance lives under:
  - `docs/ios-native/README.md`
  - `docs/ios-native/parity-review-2026-04-10.md`

## Prompt status

- `prompts/` now keeps the reusable staged workflow surface:
  - `prompts/run-pile-planning-workflow.md`
  - `prompts/run-group-workflow.md`
  - `prompts/run-milestone-workflow.md`
  - `prompts/reasoning-effort-profiles.md`
  - `prompts/piles/README.md`
  - `prompts/README.md`
- `scripts/codex/` now keeps repo-local Codex CLI helper scripts for pile planning, group execution, and bundle execution.
- Historical generated pile execution details are not retained in the worktree.
- Future staged workflows should use the `Pile -> Group -> Bundle` structure, group-related work at the group level, and keep bundle folders named as domain use cases such as `timer-active-session`.

## Current gaps and likely next work

- The main remaining product gap is a fuller user-managed or backend-backed `custom play` media source beyond the current script-driven registration flow.
- Real-device QA still matters for iPhone Safari timer completion behavior and native iPhone notification or lock-screen audio edge cases.
- If new staged workflows are needed later, create fresh pile folders under `prompts/piles/` rather than assuming older generated piles still exist.

## Working notes for the next agent

- Do not trust this file for the active Git branch; check `git status -sb` when you start work.
- Keep this handoff short and update the durable docs instead of appending long history here.
- Do not add historical execution logs back into the repo unless the user explicitly asks for them.
