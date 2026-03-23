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
2. implement Playlists as a vertical slice
3. support create/edit/delete/favorite playlists
4. support ordered playlist items and derived total duration
5. add a lightweight playlist run flow suitable for a prototype
6. define and implement how playlist sessions are logged
7. integrate playlist logs into History
8. keep the UX responsive and calm across mobile, tablet, and desktop
9. add focused tests for playlist validation and logging rules
10. run typecheck, lint, test, and build
11. update decisions and session-handoff
12. include the exact recommended next prompt in session-handoff
13. commit with a clear message:
   feat(playlists): add playlists and playlist logging vertical slice
