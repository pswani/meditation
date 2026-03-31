Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for fixing active-timer runtime and recovery defects.

2. Fix the active timer persistence and recovery defects so an in-progress session can be represented, persisted, rehydrated, resumed, or cleared stale correctly.

3. Keep the scope bounded to the active timer runtime model and its immediate integrations.
   Included:
   - timer reducer active-session model
   - active timer persistence serialization and hydration
   - recovery of paused and running timer sessions after reload
   - stale-session clearing behavior
   - Active Timer page and shell banner correctness
   - timer sound cue calculations if they depend on active-session timing state

   Excluded:
   - unrelated playlist runtime changes
   - unrelated UI redesign
   - new features outside correctness and recovery

4. Behavior expectations:
   - the app must use one coherent active-session model across reducer, storage, UI, and sound/runtime helpers
   - refreshing or remounting during an active fixed-duration session must recover the session accurately when it is still resumable
   - stale persisted sessions that can no longer be resumed safely must be cleared with truthful messaging
   - paused sessions must stay paused and preserve timing correctness
   - fixed-duration timer display, shell banner state, and sound cues must stay correct after this cleanup

5. Add or update focused tests for:
   - active-session reducer transitions
   - persistence serialization/hydration
   - rehydration of resumable sessions
   - stale-session clearing
   - Active Timer page and shell banner behavior after recovery

6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend verification commands if API contracts are touched

7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

8. In session-handoff, include:
   - what runtime/recovery defects were fixed
   - the chosen active-session model
   - any remaining limitations
   - exact recommended next prompt

9. Commit with a clear message, for example:
   - `fix(timer): restore active session recovery and runtime consistency`
