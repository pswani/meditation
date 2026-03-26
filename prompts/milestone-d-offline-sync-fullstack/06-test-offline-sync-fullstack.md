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

1. Create an ExecPlan for strong end-to-end offline/sync verification.
2. Thoroughly test:
   - online startup
   - offline startup
   - offline actions
   - reconnection
   - sync success
   - sync partial failure and retry
3. Improve coverage where needed with focused maintainable tests only.
4. Run full relevant verification.
5. Update docs and session-handoff with exact recommended next prompt.
6. Commit with a clear message:
   test(sync): verify offline-first and reconciliation full-stack flows
