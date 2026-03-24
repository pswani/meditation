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

- docs/review-timer-history.md

Then:

1. Create an ExecPlan.
2. Fix the critical and important issues from docs/review-timer-history.md.
3. Keep scope bounded to the timer/history slice and the minimum related integration needed to resolve the issues cleanly.
4. Preserve existing functionality unless a review finding requires a behavior fix.
5. Add or update focused tests where behavior changes.
6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
8. Include exact recommended next prompt in session-handoff.
9. Commit with a clear message:
   feat(ux): refine timer history slice after review
