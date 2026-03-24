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


Then:

1. Create an ExecPlan for Milestone A line item 1:
   - Timer Setup
   - Active Timer
   - session completion
   - automatic session logging
   - History integration
   - front-end to back-end integration for this slice using REST APIs

2. Build this as a real end-to-end feature slice.
3. Ensure:
   - duration selection works
   - meditation type selection works
   - optional start/end/interval sound settings work as prototype or real persisted state
   - interval validation is correct
   - active timer supports pause/resume/end
   - completed and ended-early sessions create trustworthy auto logs
   - History accurately reflects session outcomes
   - front end uses clean REST integration to persist and read logs/settings where appropriate
   - if media metadata is needed, use file-path references from the database rather than binary blobs

4. Make it responsive across mobile, tablet, and desktop.
5. Add focused tests for critical timer/logging logic and API contract behavior where practical.
6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
8. Include exact recommended next prompt in session-handoff.
9. Commit with a clear message:
   feat(core): implement timer active session auto-log history and rest integration
