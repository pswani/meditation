Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-screen-decomposition-hardening-feature.md`
- `docs/test-screen-decomposition-hardening-feature.md`

Goal:
- Address actionable issues found during review or testing for the remaining screen and manager decomposition phase.

Rules:
- Stay within the original phase scope.
- Do not widen into backend, configuration, or media/cache work already covered by earlier bundles.
- Fix only validated issues from review or testing.
- Keep the calm, serious, minimal product feel intact.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `docs/architecture.md`, `docs/ux-spec.md`, `requirements/decisions.md`, and `requirements/session-handoff.md` if the final repo state or long-lived decisions changed.
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

