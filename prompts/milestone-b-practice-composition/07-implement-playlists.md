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

1. Create an ExecPlan for playlists.
2. Implement:
   - create/edit/delete playlists
   - reorder items
   - total duration calculation
   - favorite playlists
   - lightweight playlist run flow
   - define and implement playlist logging behavior
3. Integrate playlist results into History.
4. Use clean REST integration between the front end and back end where persistence is involved.
5. Make it responsive across mobile, tablet, and desktop.
6. Add focused tests for playlist rules, logging behavior, and relevant contract boundaries.
7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
8. Update decisions and session-handoff.
9. Commit with a clear message:
   feat(composition): add playlists and playlist run flow
