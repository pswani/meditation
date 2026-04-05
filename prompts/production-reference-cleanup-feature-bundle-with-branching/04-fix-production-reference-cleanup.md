Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-production-reference-cleanup-feature.md`
- `docs/test-production-reference-cleanup-feature.md`

Goal:
- Address actionable issues found during review or testing for the production reference and build cleanup phase.

Rules:
- Stay within the original phase scope.
- Do not widen into media ownership cleanup, cache-version redesign, or broad UI refactors.
- Fix only validated issues from review or testing.
- Keep operator and documentation behavior explicit and production-first.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests or scripts if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `README.md`, `docs/architecture.md`, `requirements/decisions.md`, and `requirements/session-handoff.md` if the final repo state or long-lived decisions changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- run the new or tightened single-entry verification command
- if that command does not already cover everything, also run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.

