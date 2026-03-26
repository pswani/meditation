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

1. Create an ExecPlan for offline-first architecture on top of the now-existing full-stack app.
2. Design and implement the minimum clean architecture so the front end can work locally without live backend connectivity and sync later.
3. Keep REST integration clean and practical.
4. Add the shared offline/sync foundations.
5. Update docs and session-handoff with exact recommended next prompt.
6. Commit with a clear message:
   refactor(sync): establish offline-first full-stack sync architecture
