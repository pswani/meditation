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

1. Create an ExecPlan for targeted Milestone B testing and QA.
2. Strengthen testing for:
   - manual log validation
   - manual vs auto log differentiation
   - custom play validation and persistence
   - media asset selection behavior
   - playlist ordering and total duration logic
   - playlist run/logging rules
   - relevant REST integration boundaries for this milestone
3. Improve fragile tests if needed.
4. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
5. Update decisions and session-handoff.
6. Commit with a clear message:
   test(composition): harden milestone b flows and integration points
