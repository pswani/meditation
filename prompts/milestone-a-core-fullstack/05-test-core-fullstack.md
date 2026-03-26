Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for a strong test pass on Milestone A.
2. Thoroughly test:
   - backend startup
   - H2 persistence for the core flow
   - timer -> log -> history
   - settings -> timer defaults
   - Home launch-surface behavior
3. Improve test coverage where needed with focused maintainable tests only.
4. Run the full relevant verification suite.
5. Update docs and session-handoff with exact recommended next prompt.
6. Commit with a clear message:
   test(core): verify core full-stack practice engine end to end
