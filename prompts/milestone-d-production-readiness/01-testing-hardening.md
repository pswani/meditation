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

1. Create an ExecPlan for testing and hardening.
2. Strengthen test coverage for critical app flows and fragile logic across the full application.
3. Improve reliability of existing tests.
4. Add missing focused tests for:
   - timer/session logic
   - logging
   - settings persistence
   - manual logging
   - custom plays
   - playlists
   - summaries
   - sankalpa
   - front-end/back-end REST boundaries where practical
5. Avoid meaningless tests.
6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
7. Update decisions and session-handoff.
8. Commit with a clear message:
   test(app): harden critical flows and domain logic
