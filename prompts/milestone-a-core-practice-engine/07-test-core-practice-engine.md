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

1. Create an ExecPlan for targeted Milestone A testing and QA.
2. Strengthen testing for:
   - timer validation logic
   - active session transitions
   - session log creation rules
   - Home derived display logic
   - Settings persistence
   - critical route rendering and navigation behavior
   - relevant REST integration boundaries for this milestone
3. Improve fragile tests if needed.
4. Do not add meaningless tests.
5. Run a strong verification pass:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
6. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
7. Include exact recommended next prompt in session-handoff.
8. Commit with a clear message:
   test(core): harden milestone a flows and integration points
