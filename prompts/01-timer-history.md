Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then do the following:

1. Create an ExecPlan for a vertical slice that implements:
   - Timer Setup screen
   - Active Timer screen
   - session completion flow
   - automatic session logging
   - History screen with recent logs

2. Keep the scope intentionally bounded to this slice only.
   Included:
   - choose duration
   - choose meditation type from the predefined list
   - optional start sound selector from a fixed mock list
   - optional end sound selector from a fixed mock list
   - optional interval bell configuration
   - validation that interval bells fit within total duration
   - start session
   - active timer with pause, resume, and end
   - completion state
   - auto-create a session log entry after completion or early end
   - History screen showing recent logs
   - clearly distinguish completed vs ended-early sessions
   - responsive UX that works well on mobile, tablet, and desktop
   - local-only state and persistence suitable for a prototype

   Excluded from this slice:
   - custom plays
   - playlists
   - manual session logging
   - summaries
   - sankalpa goals
   - backend
   - cloud sync
   - notifications
   - audio playback beyond simple mocked sound selection/state

3. Use the existing product terminology exactly:
   - meditation type
   - session log
   - auto log
   - history
   - sankalpa

4. Implement route-level screens and supporting components for:
   - Practice / Timer Setup
   - Active Timer
   - History

5. Add a realistic but lightweight prototype implementation:
   - predefined meditation types:
     - Vipassana
     - Ajapa
     - Tratak
     - Kriya
     - Sahaj
   - fixed sound option lists for start/end/interval sounds
   - local persistence for session logs and last-used timer settings
   - clean empty states
   - clear validation states
   - calm, minimal responsive layout

6. Implement explicit validation rules:
   - duration must be > 0
   - meditation type is required
   - interval bells are optional
   - if interval bells are enabled, each interval must be less than the total duration
   - repeated interval behavior must not imply events after the session ends
   - pause/resume must preserve timing correctness
   - ending early must still create a log with the actual completed duration and status = ended early

7. Add focused tests for:
   - timer validation utilities
   - interval validation
   - session-log creation rules
   - any reducer/state logic that is central to this slice

8. Keep the design calm and minimal.
9. Avoid unrelated refactors and avoid adding extra libraries unless clearly justified.

10. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build

11. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

12. In session-handoff, include:
   - what was implemented
   - what remains for the next vertical slice
   - known limitations
   - exact recommended next prompt

13. Commit with a clear message:
   feat(timer): implement timer flow and auto-logged history vertical slice
