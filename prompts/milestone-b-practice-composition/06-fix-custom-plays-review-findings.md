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

- docs/review-custom-plays.md

Then:

1. Create an ExecPlan.
2. Fix the critical and important issues from docs/review-custom-plays.md.
3. Keep scope bounded to custom plays and the minimum supporting flows needed to resolve issues cleanly.
4. Add or update focused tests where behavior changes.
5. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
6. Update decisions and session-handoff.
7. Commit with a clear message:
   feat(ux): refine custom plays after review
