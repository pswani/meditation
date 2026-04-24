# Current State

This file is the concise handoff for the repository as it exists now. Use it as a pointer to the stable docs, not as a running transcript.

## Repository truth

- The repo is a working full-stack meditation application with:
  - a React + TypeScript + Vite frontend
  - a Spring Boot backend in `backend/`
  - H2 persistence plus Flyway migrations
  - offline-first queue-backed behavior for implemented backend-backed domains
  - native iPhone work under `ios-native/`
- Primary product journeys now exist across Home, Practice, History, Sankalpa, and Settings.
- Implemented domains include timer sessions, `custom play`, playlists, automatic and manual `session log` flows, summaries, and `sankalpa`, including weekly manual observance goals such as gym attendance.
- `Sankalpa` now persists an optional editable title, with the create/edit form prefilling that title from the current goal settings and observance cards labeling their per-date rows as `Activity Tracking`.

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

- The high and medium issues from `review-artifacts/ux-review.md` are now addressed across the web app and native iPhone presentation:
  - web mobile shell spacing no longer traps content under fixed chrome
  - the primary nav now uses `Sankalpa` to match the page title while keeping the `/sankalpa` compatibility route
  - Home hierarchy, empty-state actions, calmer sync and recording copy, and playlist validation clearing were tightened up
  - the Sankalpa screen now collapses lower-priority sections on phone for a calmer first view
  - native iPhone sync banners and practice-library cards are more compact and less technical
  - native iPhone custom play and playlist Add actions now open full-screen create flows with clear `New custom play` and `New playlist` titles
- The main remaining product gap is a fuller user-managed or backend-backed `custom play` media source beyond the current script-driven registration flow.
- Real-device QA still matters for iPhone Safari timer completion behavior and native iPhone notification or lock-screen audio edge cases; the web timer now has a scheduled unfocused completion path when the browser page remains runnable.
- Native iPhone helper scripts now default to SDK-target app builds plus shared-core SwiftPM tests; full scheme XCTest runs remain opt-in until Xcode lists an eligible simulator or device destination.
- Session-log sync no longer requires referenced `custom play` or playlist rows to still exist in the backend database; historical log context is now stored as snapshot metadata so native replay stays resilient after library deletes or out-of-order reconciliation.
- The release bundle scripts now honor `--bundle-dir` during packaging, and `release` performs an upfront sudo preflight so non-interactive runs fail with clear guidance before spending time on the install step.
- If new staged workflows are needed later, create fresh pile folders under `prompts/piles/` rather than assuming older generated piles still exist.

## Working notes for the next agent

- Do not trust this file for the active Git branch; check `git status -sb` when you start work.
- Keep this handoff short and update the durable docs instead of appending long history here.
- Do not add historical execution logs back into the repo unless the user explicitly asks for them.
