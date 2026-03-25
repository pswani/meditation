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

1. Create an ExecPlan for thorough end-to-end testing and verification of the application.
2. Inspect the current implementation and determine the most important end-to-end user journeys that should be validated now.
3. Cover the currently implemented application comprehensively, including front-end, back-end, REST integration, H2-backed persistence, and media-path handling where present.
4. Validate and test, as applicable:
   - app startup
   - navigation across routes
   - Home flow
   - Settings flow and persistence
   - Timer setup validation
   - active timer flow
   - pause/resume/end behavior
   - session completion and ended-early behavior
   - auto logging into History
   - manual logging if implemented
   - custom plays if implemented
   - playlists if implemented
   - summaries if implemented
   - sankalpa if implemented
   - REST API contracts if present
   - H2 persistence behavior if present
   - sound/media path reference handling if present
5. Add or improve end-to-end or high-value integration tests where practical.
6. Prefer meaningful scenario coverage over a large number of shallow tests.
7. Fix the issues required to make the tested journeys pass reliably.
8. Run a thorough verification pass:
   - npm install
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - run the app locally with the documented startup command(s)
9. If the repo includes separate front-end and back-end apps, verify both sides and their integration paths.
10. Update:
   - README.md if instructions are incomplete or wrong
   - requirements/decisions.md
   - requirements/session-handoff.md
11. In session-handoff, include:
   - tested journeys
   - test gaps that still remain
   - issues fixed
   - current end-to-end confidence level
   - exact recommended next prompt
12. Commit with a clear message, for example:
   test(e2e): verify major user journeys and stabilize application behavior
