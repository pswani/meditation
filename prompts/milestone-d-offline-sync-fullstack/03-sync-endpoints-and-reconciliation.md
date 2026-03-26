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

1. Create an ExecPlan.
2. Implement backend sync endpoints or sync-safe REST behavior for reconciliation.
3. Handle retries, duplicate protection, and basic conflict strategy cleanly.
4. Add focused tests and run full verification.
5. Update docs and session-handoff with exact recommended next prompt.
6. Commit with a clear message:
   feat(sync): add backend reconciliation for offline-created data
