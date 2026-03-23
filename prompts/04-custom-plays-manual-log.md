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
2. implement Custom Plays and Manual Session Logging as one vertical slice
3. add create/edit/delete/favorite for custom plays
4. support manual session entry with validation
5. integrate both into History with clear manual vs auto badges
6. keep it responsive across mobile, tablet, and desktop
7. add focused tests
8. run typecheck, lint, test, and build
9. update decisions and session-handoff
10. include the exact recommended next prompt in session-handoff
11. commit with a clear message:
   feat(logging): add custom plays and manual session logging vertical slice
