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

1. Create an ExecPlan for completing the core practice engine end to end.
2. Ensure these flows work against the backend where appropriate:
   - Home as launch surface
   - Settings persistence
   - Timer setup and active timer
   - session completion and ended-early handling
   - History display
3. Make the app runnable as a real full-stack local setup.
4. Add focused tests for:
   - REST contract usage
   - settings persistence
   - history rendering
   - timer-to-log backend flow
5. Run full relevant verification.
6. Update docs and session-handoff with exact recommended next prompt.
7. Commit with a clear message:
   feat(core): complete timer history home and settings full-stack flow
