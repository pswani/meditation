# ExecPlan: Active Timer Recovery

## Objective
Fix active timer persistence and recovery so one coherent active-session model can be persisted, rehydrated, resumed, paused, or cleared stale safely.

## Why
The current active timer flow still mixes an `activeSession` object with duplicate wrapper pause state and only partially normalizes recovered sessions. That weakens runtime trust around reload recovery, stale clearing, and shell/banner messaging.

## Scope
Included:
- active timer persistence serialization and hydration
- active-session recovery for running and paused sessions
- stale-session clearing behavior
- Active Timer and shell banner correctness tied to recovered session state
- focused tests for reducer/storage/recovery/UI behavior

Excluded:
- playlist runtime changes
- broader timer redesign
- new product features outside runtime correctness

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
- `prompts/timer-defaults-and-runtime-defects-with-branching/02-fix-active-timer-recovery.md`

## Affected files and modules
- `src/features/timer/TimerContext.tsx`
- `src/utils/storage.ts`
- `src/app/AppShell.tsx`
- active timer persistence/recovery tests in `src/App.test.tsx`, `src/features/timer/TimerContext.test.tsx`, and `src/utils/storage.test.ts`

## UX behavior
- Running fixed-duration sessions recover with truthful remaining time when still resumable.
- Paused sessions rehydrate as paused and stay paused until the user resumes them.
- Stale fixed sessions that have already finished cannot reappear as resumable sessions.
- Shell messaging distinguishes active vs paused timer state clearly after recovery.

## Data and state model
- Persist one canonical `ActiveSession` snapshot for the timer runtime.
- Continue reading legacy stored timer payloads so older local browser state can recover or clear safely.
- Recovery normalizes the loaded session before it reaches UI, timing helpers, or sound helpers.

## Risks
- Persistence-format changes must remain backward-compatible with existing local browser state.
- Recovery logic must not replay timer sounds or duplicate session-end behavior after hydration.
- The shell banner copy update should preserve the current navigation affordance across breakpoints.

## Milestones
1. Document the plan and inspect the current active-session persistence path.
2. Normalize stored active timer state and legacy hydration.
3. Tighten recovery and stale-clearing behavior for running and paused fixed sessions.
4. Update shell/runtime messaging and add focused tests.
5. Run verification, update docs, and commit.

## Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Decision log
- Keep legacy active timer storage reads working while moving new writes to one canonical `ActiveSession` snapshot.
- Distinguish paused-session recovery explicitly in user-facing shell copy because recovery state affects what action the user can safely take next.

## Progress log
- 2026-03-31: Reviewed active timer persistence, recovery helpers, shell messaging, and the current test coverage after prompt `01`.
