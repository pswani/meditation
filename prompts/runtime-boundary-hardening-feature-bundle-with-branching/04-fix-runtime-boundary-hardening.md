Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-runtime-boundary-hardening-feature.md`
- `docs/test-runtime-boundary-hardening-feature.md`

Goal:
- Address actionable issues found during review or testing for the runtime-boundary hardening phase.

Rules:
- Stay within the original phase scope.
- Do not widen into backend query work, reference cleanup, or media/cache redesign.
- Fix only validated issues from review or testing.
- Keep the existing product behavior calm, trustworthy, and responsive.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `README.md`, `docs/architecture.md`, `requirements/decisions.md`, and `requirements/session-handoff.md` if the final repo state or long-lived decisions changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification only if backend code or contracts changed

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.

