# AGENTS.md

## Repository purpose
This repository contains the meditation application and related implementation assets. The product should evolve from a prototype into a clean, fully functioning application with calm UX, clear architecture, and trustworthy behavior.

## Product intent
Build a serious, minimal, peaceful meditation practice app with:
- fast start home
- timer meditation
- optional start/end/interval sounds
- meditation types
- custom plays
- playlists
- automatic and manual session logging
- summaries
- sankalpa goals

Avoid:
- social feed
- public community features
- AI coach
- sleep story marketplace
- unnecessary gamification
- heavy dashboard clutter

## Required reading before work
Always read these before changing behavior or structure:
- README.md
- requirements/intent.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

For complex or multi-step changes, also follow:
- PLANS.md

## Engineering expectations
- Use the stack already established by the repo unless the task explicitly requires extending it.
- Prefer small, focused components and modules.
- Keep business logic outside large JSX trees.
- Keep styling simple and consistent.
- Prefer explicit types over implicit `any`.
- Prefer predictable state and clean boundaries between UI, domain logic, persistence, and API integration.
- Start with local-first persistence unless the task explicitly requires backend integration.
- Avoid adding dependencies unless clearly justified.
- Do not refactor unrelated areas.
- Prefer incremental vertical slices over broad unfinished scaffolding.

## App architecture expectations
- `src/pages` contains route-level screens.
- `src/components` contains shared presentational components.
- `src/features` contains feature-specific UI and logic.
- `src/types` contains shared domain types.
- `src/utils` contains pure helpers and validation.
- Keep domain naming consistent with product terminology.
- Keep state and validation logic out of large JSX render trees.
- Prefer reusable domain helpers for timer, logging, playlist, summary, and sankalpa rules.
- If a backend exists or is introduced, keep the REST boundary clean and explicit.
- If H2 is used, keep schema, persistence, and media metadata modeling straightforward and well documented.
- Media files should live on disk under a configured directory, with DB-backed metadata/path references rather than blobs unless requirements explicitly say otherwise.

## Multi-device UX rules
The app must work well on:
- mobile phones
- tablets
- laptops
- desktops

Design and implementation expectations:
- use mobile-first CSS, but do not optimize only for phones
- layouts must adapt gracefully at common breakpoints
- navigation may change form across breakpoints, but terminology and destination structure must remain consistent
- avoid forcing desktop users through overgrown mobile-only stacks
- do not hide essential functionality behind hover-only interactions
- forms and controls must remain touch-friendly on smaller devices
- take advantage of additional space on tablet and desktop without making screens noisy or dashboard-heavy
- preserve a calm, minimal visual experience at every size
- use responsive patterns intentionally; do not create separate product experiences per device unless clearly justified

Suggested breakpoint intent:
- small: phone
- medium: tablet
- large: laptop/desktop

## Vertical-slice delivery expectations
Prefer meaningful vertical slices over tiny disconnected tasks.

A good slice should:
- deliver a real user journey end to end
- include the minimum UI, state, validation, persistence, and API work needed for that journey
- be substantial enough to show visible progress
- remain bounded enough to complete with confidence in one session

When deciding scope, prefer slices such as:
- timer setup + active timer + auto logging + history
- custom plays + manual logging + history integration
- playlists + playlist run flow + playlist logging
- summaries + sankalpa

Avoid:
- shell-only work unless explicitly requested
- overly granular prompts that produce partial infrastructure without usable behavior
- oversized prompts that combine too many major features at once

## Domain terminology
Use these exact product terms consistently:
- meditation type
- custom play
- playlist
- session log
- manual log
- sankalpa
- summary
- favorite
- recent

Do not introduce new terms for the same concepts.

## UX rules
- Optimize for multi-device UX with mobile-first implementation.
- Minimize taps for starting a meditation.
- Timer flow should feel calm and distraction-free.
- Validation messages should be clear and human-readable.
- Important actions must be obvious.
- Do not overload screens with analytics or dense controls.
- Prefer progressive disclosure for advanced options such as interval bells, extra filters, or secondary settings.
- Empty states should help the user take the next useful action.
- Placeholder screens are acceptable only as part of an initial shell; subsequent work should favor functioning prototype behavior.

## Prototype expectations
Unless the task explicitly asks for production hardening, implement features as a functioning prototype that demonstrates the intended user journey.

For prototype slices:
- use realistic sample data where helpful
- use fixed mock option lists where real integrations do not yet exist
- prefer local state and local persistence until backend integration is intentionally introduced
- make interactions visible and testable
- clearly separate what is mocked from what is real behavior

## Validation rules
### Timer
- total duration must be greater than 0
- meditation type is required unless requirements explicitly say otherwise
- interval sounds are optional
- if interval sounds are enabled, each interval must be less than total duration
- repeating intervals must fit within the session
- pause/resume must preserve timer correctness
- ending early should still produce a session log with actual completed duration and appropriate status

### Manual logging
- duration must be greater than 0
- meditation type is required
- session timestamp is required

### Sankalpa
- goal must be either duration-based or session-count-based
- days must be greater than 0
- optional filters:
  - meditation type
  - time-of-day bucket
- completed duration may count proportionally for duration-based goals
- manual logs count unless explicitly excluded by feature requirements

### Playlist
- playlist must contain at least 1 item
- playlist order must be preserved
- total derived duration must be computed correctly
- playlist logging behavior must be defined explicitly when playlists are implemented

## Local command and process permissions
For this repository, local development and verification commands are allowed when needed to complete the task.

Allowed local activities:
- run `curl` against `localhost`, `127.0.0.1`, or the developer machine's LAN IP for health checks, API verification, and local end-to-end checks
- start, restart, and stop local npm-based front-end servers as needed
- start, restart, and stop local backend application servers as needed
- start, restart, stop, reset, migrate, or seed local H2-backed application processes or local development DB flows used by this repo
- run local build, test, lint, typecheck, migration, seed, and reset commands that belong to this repo

Boundaries:
- operate only on local development processes for this repository
- prefer repo scripts and documented commands over ad hoc commands when available
- do not call external production services unless the task explicitly allows it
- do not delete user data outside documented local reset or cleanup flows
- before destructive local DB reset actions, verify they are local-development-only

Process management expectations:
- if a local server is started for verification, record the command used and the host/port where practical
- clean up temporary background processes when finished unless the task explicitly requires leaving them running

## Browser automation and Playwright MCP expectations
If a Playwright MCP server is configured and available in the Codex environment, it may be used for local browser verification of the application.

Use it for:
- opening the local app in a browser
- validating localhost or LAN-accessible UI flows
- checking route navigation, empty states, and major user journeys
- verifying front-end to backend connectivity from the browser where practical

Boundaries:
- use it for local development URLs only unless the task explicitly says otherwise
- prefer it for realistic end-to-end local verification when browser behavior matters
- if Playwright MCP is not configured or unavailable, fall back to command-line and test-based verification without blocking the task

## Testing expectations
When changing behavior:
- add or update focused tests for validation and state logic where practical
- do not add shallow or meaningless tests
- prioritize validation, reducers, selectors, domain helpers, utility functions, and API integration boundaries
- for vertical slices, test the load-bearing logic first
- when browser behavior matters, add or improve end-to-end style verification where practical

## Documentation expectations
After each meaningful implementation slice:
- update the durable product or operational docs that changed
- update `requirements/decisions.md` when long-lived implementation or operational decisions change
- update `requirements/session-handoff.md` when the current repo state, remaining gaps, or recommended next slice materially changes
- keep `requirements/session-handoff.md` concise and current rather than appending step-by-step history

## Done means
Before considering work complete:
1. behavior matches requirements
2. code is readable and scoped
3. types pass
4. lint passes
5. tests pass
6. build passes
7. docs are updated if behavior or structure changed
8. decisions and current-state docs are updated when needed

## Required commands
Run these after meaningful changes where applicable:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Also run any relevant backend verification commands if the repository includes a backend.

## Commit expectations
After completing a task:
1. review changed files
2. confirm no unrelated edits were introduced
3. write a clear commit message

Suggested commit style:
- feat(timer): add interval bell validation
- feat(playlists): support manual reordering
- fix(logging): preserve manual entry timestamps
- docs(ux): refine sankalpa flow
- chore(dev): enable local network access for testing
- feat(sync): add offline queue reconciliation

## ExecPlans
When writing complex features or significant refactors, use an ExecPlan before implementation.

Use an ExecPlan for:
- new major features
- major refactors
- navigation changes
- data model changes
- state management changes
- backend integration changes
- database schema changes
- offline/sync changes
- large UX redesigns

A good ExecPlan should cover:
- objective
- why the change matters
- scope and explicit exclusions
- source docs reviewed
- affected files/modules
- UX behavior and validations
- data/state/API model
- risks and tradeoffs
- milestones
- verification plan
- decision log
- progress log

Keep ExecPlans focused on active work. When a task-specific ExecPlan stops being useful, fold any durable outcomes back into the long-lived docs instead of letting obsolete planning artifacts accumulate.
