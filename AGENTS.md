# AGENTS.md

## Repository purpose
This repository contains the React front-end for a meditation app focused on calm daily practice without unnecessary feature bloat.

## Product intent
Build a serious, minimal, peaceful meditation practice app with:
- fast start home
- timer meditation
- optional start/end/interval sounds
- meditation types
- custom plays
- playlists# AGENTS.md

## Repository purpose
This repository contains the React front-end for a meditation app focused on calm daily practice without unnecessary feature bloat.

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
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md

For complex or multi-step changes, also follow:
- PLANS.md

## Engineering expectations
- Use React + TypeScript.
- Prefer functional components.
- Prefer small, focused components.
- Keep business logic outside large JSX trees.
- Keep styling simple and consistent.
- Prefer explicit types over implicit `any`.
- Prefer predictable local state.
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
- include the minimum UI, state, validation, and persistence needed for that journey
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
Unless the task explicitly asks for production-hardening, implement features as a functioning prototype that demonstrates the intended user journey.

For prototype slices:
- use realistic sample data where helpful
- use fixed mock option lists where real integrations do not yet exist
- prefer local state and local persistence
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

## Testing expectations
When changing behavior:
- add or update focused tests for validation and state logic where practical
- do not add shallow or meaningless tests
- prioritize validation, reducers, selectors, domain helpers, and utility functions
- for vertical slices, test the load-bearing logic first

## Session handoff expectations
After each meaningful implementation slice:
- update `requirements/session-handoff.md`
- update `requirements/decisions.md`
- summarize what was implemented
- note what remains unfinished for the current feature area
- record known limitations, shortcuts, and prototype assumptions
- include a well-formed recommended next prompt in `requirements/session-handoff.md`

The recommended next prompt must:
- be implementation-ready
- define a meaningful vertical slice
- be bounded, not too granular and not too large
- list what is included and excluded
- require doc updates, verification, and a clear commit

## Done means
Before considering work complete:
1. behavior matches requirements
2. code is readable and scoped
3. types pass
4. lint passes
5. tests pass
6. build passes
7. docs are updated if behavior or structure changed
8. session-handoff and decisions are updated
9. session-handoff includes the exact recommended next prompt for the next slice

## Required commands
Run these after meaningful changes:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

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

## ExecPlans
When writing complex features or significant refactors, use an ExecPlan as described in PLANS.md before implementation.

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
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md

For complex or multi-step changes, also follow:
- PLANS.md

## Engineering expectations
- Use React + TypeScript.
- Prefer functional components.
- Prefer small, focused components.
- Keep business logic outside large JSX trees.
- Keep styling simple and consistent.
- Prefer explicit types over implicit any.
- Prefer predictable local state.
- Avoid adding dependencies unless clearly justified.
- Do not refactor unrelated areas.

## App architecture expectations
- `src/pages` contains route-level screens.
- `src/components` contains shared presentational components.
- `src/features` contains feature-specific UI and logic.
- `src/types` contains shared domain types.
- `src/utils` contains pure helpers and validation.
- Keep domain naming consistent with product terminology.

## Multi-device UX rules
The app must work well on:
- mobile phones
- tablets
- laptops
- desktops

Design and implementation expectations:
- mobile-first CSS, but not mobile-only
- layouts must adapt gracefully at common breakpoints
- navigation may change form across breakpoints, but terminology and destination structure must remain consistent
- avoid forcing desktop users through overgrown mobile-only stacks
- do not hide essential functionality behind hover-only interactions
- forms and controls must remain touch-friendly
- summary screens should use available desktop width intelligently without becoming visually noisy

Suggested breakpoint intent:
- small: phone
- medium: tablet
- large: laptop/desktop

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

## Validation rules
### Timer
- total duration must be greater than 0
- interval sounds are optional
- if interval sounds are enabled, each interval must be less than total duration
- repeating intervals must fit within the session
- pause/resume must preserve timer correctness

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

## Testing expectations
When changing behavior:
- add or update focused tests for validation and state logic where practical
- do not add shallow or meaningless tests
- prioritize validation, reducers, selectors, and utility functions

## Done means
Before considering work complete:
1. behavior matches requirements
2. code is readable and scoped
3. types pass
4. lint passes
5. tests pass
6. build passes
7. docs are updated if behavior or structure changed
8. session-handoff and decisions are updated

## Required commands
Run these after meaningful changes:
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

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

## ExecPlans
When writing complex features or significant refactors, use an ExecPlan as described in PLANS.md before implementation.
