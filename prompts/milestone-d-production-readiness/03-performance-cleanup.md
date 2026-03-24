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

1. Create an ExecPlan for performance cleanup.
2. Review and improve obvious performance issues in the current front end and any directly related back-end paths:
   - unnecessary re-renders
   - duplicated expensive derivations
   - overly large components
   - wasteful persistence/update patterns
   - obvious N+1 or wasteful query patterns if present
3. Keep changes bounded and safe.
4. Avoid speculative micro-optimizations.
5. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
6. Update decisions and session-handoff.
7. Commit with a clear message:
   perf(app): clean up obvious front-end and integration inefficiencies
