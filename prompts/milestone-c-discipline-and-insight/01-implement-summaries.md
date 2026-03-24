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

1. Create an ExecPlan for summaries.
2. Implement:
   - overall summaries
   - by-type summaries
   - by-source summaries if supported
   - date-range summary views
3. Keep the UX calm and readable, not dashboard-heavy.
4. Use clean REST integration if summaries are derived or fetched from the back end.
5. Make it responsive across mobile, tablet, and desktop.
6. Add focused tests for summary derivation logic and any relevant API behavior.
7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
8. Update decisions and session-handoff.
9. Commit with a clear message:
   feat(insight): add meditation summaries
