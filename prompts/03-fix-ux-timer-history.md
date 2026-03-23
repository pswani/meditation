Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-timer-history.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:
1. create an ExecPlan
2. implement the critical and important UX improvements from docs/ux-review-timer-history.md
3. keep scope bounded to UX improvements for:
   - Timer Setup
   - Active Timer
   - History
4. preserve existing functionality unless a reviewed issue requires a behavior fix
5. improve responsive behavior across mobile, tablet, and desktop
6. keep the design calm, minimal, and readable
7. add or update focused tests where behavior changes
8. run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
9. update:
   - requirements/decisions.md
   - requirements/session-handoff.md
10. include the exact recommended next prompt in session-handoff
11. commit with a clear message:
   feat(ux): refine timer and history responsive experience
