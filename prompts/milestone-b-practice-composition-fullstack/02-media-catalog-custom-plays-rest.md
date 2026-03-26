Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan for media catalog and custom plays.
2. Implement backend support for:
   - media asset metadata in H2
   - media file path references
   - media root directory configuration
   - REST endpoints for listing relevant media assets
   - custom play persistence
3. Wire the front end custom plays flow to the backend.
4. Document exactly where media files should be placed and how they map to app options.
5. Add focused tests and run full verification.
6. Update docs and session-handoff with exact recommended next prompt.
7. Commit with a clear message:
   feat(composition): add media catalog and custom plays rest integration
