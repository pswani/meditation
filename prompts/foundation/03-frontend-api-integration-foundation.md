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

1. Create an ExecPlan for front-end API integration foundation.
2. Replace ad hoc local-only API shims with a clean API boundary that can talk to the new backend while preserving current UX where practical.
3. Implement:
   - configurable API base URL strategy
   - common API client layer
   - local dev proxy or documented LAN-safe API configuration
   - typed request/response boundaries where practical
   - graceful error handling
4. Keep scope bounded to infrastructure and integration setup, not all feature migrations yet.
5. Update docs and tests as needed.
6. Run full relevant verification:
   - frontend build/test/lint/typecheck
   - backend build/test/startup checks
7. Update session-handoff with exact recommended next prompt.
8. Commit with a clear message:
   refactor(frontend): establish typed rest api integration foundation
