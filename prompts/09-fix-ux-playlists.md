Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-playlists.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:
1. create an ExecPlan
2. implement the critical and important UX improvements from docs/ux-review-playlists.md
3. keep scope bounded to playlists and related history behavior
4. preserve functionality unless a UX issue requires a behavior change
5. improve responsiveness across mobile, tablet, and desktop
6. add focused tests where behavior changes
7. run typecheck, lint, test, and build
8. update decisions and session-handoff
9. include the exact recommended next prompt in session-handoff
10. commit with a clear message:
   feat(ux): refine playlist creation and run experience
