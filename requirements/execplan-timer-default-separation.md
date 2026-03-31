# ExecPlan: Timer Default Separation

## Objective
Separate session-scoped timer setup edits in Practice from persisted default timer settings so only Settings changes saved defaults.

## Why
Practice currently mutates the same timer settings state that Settings persists. That makes routine session setup, Home custom play shortcuts, and Practice custom play "Use" flows overwrite default timer preferences unexpectedly, which breaks quick start trust.

## Scope
Included:
- Practice timer setup state ownership
- Settings default-timer persistence ownership
- Home quick-start/default-timer display correctness
- custom play preload flows into Practice
- minimal timer-start API changes needed so Practice can start from a draft without persisting defaults

Excluded:
- broader timer UX redesign
- active timer recovery fixes outside what this ownership split requires
- unrelated playlist, sankalpa, history, or backend refactors

## Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/timer-defaults-and-runtime-defects-with-branching/01-fix-practice-default-timer-separation.md`

## Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerReducer.ts`
- `src/features/timer/timerContextObject.ts`
- `src/pages/PracticePage.tsx`
- `src/pages/HomePage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- focused tests in `src/pages/*.test.tsx`, `src/features/customPlays/*.test.tsx`, and `src/App.test.tsx`

## UX behavior
- Practice opens with the saved default timer configuration unless a session-scoped preset is supplied.
- Editing Practice fields changes only the current timer setup draft.
- Home continues to show the saved default timer summary from Settings.
- Home and Practice custom play "Use" actions preload timer setup without saving defaults.
- Settings remains the only place that saves or resets persisted default timer settings.

## Data and state model
- Persisted timer defaults stay in `TimerContext` and continue to back Home quick start plus Settings.
- Practice owns a local timer draft derived from persisted defaults until the user changes it or a route preset applies.
- Starting a timer accepts an explicit settings snapshot so Practice can launch a session from its local draft without mutating persisted defaults.

## Risks
- Practice draft hydration must still adopt backend-loaded defaults before the user edits.
- Route-state presets from Home must be applied once without clobbering later user edits.
- Existing tests that assume `setSettings` drives Practice directly will need to reflect the new ownership split.

## Milestones
1. Add the plan and inspect current timer settings ownership.
2. Separate Practice draft state from persisted defaults and update timer start wiring.
3. Rework Home and custom play preload flows to use Practice-only presets.
4. Add focused regression tests and run verification.
5. Update decisions and session handoff, then commit.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- no backend verification unless timer-settings contracts change

## Decision log
- Use a local Practice draft instead of broadening persisted timer state, because the defect is ownership rather than storage shape.
- Keep Home quick start wired to persisted defaults so quick start remains deterministic and low-friction.

## Progress log
- 2026-03-31: Reviewed the milestone docs, confirmed the ownership defect in `TimerContext`, and planned a bounded split between persisted defaults and Practice draft state.
