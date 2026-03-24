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

1. Create an ExecPlan for custom plays.
2. Implement:
   - create/edit/delete custom plays
   - favorite custom plays
   - assign meditation type
   - optional start/end sounds
   - media/session selection backed by server-side file metadata where appropriate
   - local or server-side persistence as appropriate for the architecture
3. Sound and related media expectations:
   - store files in a directory on disk
   - store path references and metadata in the database
   - expose clean REST endpoints for retrieving available assets and associated metadata
4. Integrate with current app flows where appropriate.
5. Make it responsive across mobile, tablet, and desktop.
6. Add focused tests for form validation, persistence, and relevant API logic.
7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
8. Update decisions and session-handoff.
9. Commit with a clear message:
   feat(composition): add custom plays
