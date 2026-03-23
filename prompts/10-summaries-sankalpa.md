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
1. create an ExecPlan
2. implement Summaries and Sankalpa as one vertical slice
3. add overall and by-type summaries
4. add sankalpa creation, tracking, and progress views
5. support duration-based and session-count-based sankalpas
6. support optional meditation type and time-of-day filters
7. define clearly what counts toward sankalpa progress
8. keep the UX responsive, calm, and minimal across mobile, tablet, and desktop
9. add focused tests for summary derivations and sankalpa counting rules
10. run typecheck, lint, test, and build
11. update decisions and session-handoff
12. include the exact recommended next prompt in session-handoff
13. commit with a clear message:
   feat(sankalpa): add summaries and sankalpa vertical slice
