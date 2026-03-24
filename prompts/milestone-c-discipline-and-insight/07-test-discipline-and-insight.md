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

1. Create an ExecPlan for targeted Milestone C testing and QA.
2. Strengthen testing for:
   - summary derivation logic
   - by-type and date-range behavior
   - sankalpa counting rules
   - time-of-day filtering behavior
   - relevant REST integration boundaries for this milestone
3. Improve fragile tests if needed.
4. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
5. Update decisions and session-handoff.
6. Commit with a clear message:
   test(insight): harden milestone c flows and integration points
