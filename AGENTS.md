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
