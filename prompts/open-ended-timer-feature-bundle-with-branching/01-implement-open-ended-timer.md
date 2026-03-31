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

1. Create an ExecPlan for implementing an open-ended meditation timer.

2. Implement a new timer mode that allows the user to:
   - start a meditation session without specifying a fixed duration
   - see elapsed time while the session is running
   - optionally use start sounds
   - optionally use interval sounds during the session if that fits the current architecture
   - pause and resume correctly
   - end the session manually whenever desired
   - create a trustworthy session log using the actual elapsed duration

3. Keep the scope bounded to this feature only.
   Included:
   - timer setup support for choosing open-ended mode
   - active timer behavior for open-ended sessions
   - elapsed-time display
   - pause/resume/end behavior
   - session completion / end flow
   - session log creation using actual elapsed time
   - History integration if history already exists
   - responsive UX across mobile, tablet, and desktop

   Excluded:
   - unrelated timer redesign
   - playlists
   - custom plays changes unless strictly required
   - backend redesign unless needed for the new timer mode
   - offline/sync redesign unless already part of current architecture

4. Design expectations:
   - the open-ended mode should feel calm and intentional
   - it should be clearly distinct from fixed-duration timer mode
   - the user should not be confused about whether the session has an end time
   - if interval sounds are supported, they must work sensibly with open-ended timing
   - avoid cluttering the timer setup UI

5. Data/model expectations:
   - record whether a session used fixed-duration or open-ended mode
   - ensure session logs can represent open-ended sessions cleanly
   - preserve compatibility with summaries, history, and sankalpa calculations where applicable
   - if the backend exists, extend the API/data model cleanly rather than adding hacks

6. Validation/behavior expectations:
   - open-ended sessions do not require a total duration
   - elapsed duration must continue correctly through pause/resume
   - ending the session must store actual completed duration
   - fixed-duration timer mode must continue to work correctly
   - if interval sounds are enabled for open-ended sessions, define and implement the rule clearly

7. Add or update focused tests for:
   - timer mode selection logic
   - elapsed-time behavior
   - pause/resume correctness
   - session-log creation for open-ended sessions
   - any reducers/selectors/helpers or backend contract changes introduced

8. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend build/test commands that exist in the repo

9. Update:
   - docs/product-requirements.md if needed
   - docs/ux-spec.md if needed
   - docs/screen-inventory.md if needed
   - requirements/decisions.md
   - requirements/session-handoff.md

10. In session-handoff, include:
   - what was implemented
   - how open-ended mode behaves
   - any limitations
   - exact recommended next prompt

11. Commit with a clear message, for example:
   feat(timer): add open-ended meditation timer mode
