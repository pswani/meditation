Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-offline-app-sync-feature.md`
- `docs/test-offline-app-sync-feature.md`

Goal:
- Address actionable issues found during review or testing for the offline-app and backend-reconciliation slice.

Rules:
- Stay within the original slice scope.
- Do not widen into new product areas, new backend sync surfaces, or unrelated UX redesign.
- Fix only validated issues from review or testing.
- Keep offline and degraded-state UX calm, compact, and trustworthy.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `README.md`, `requirements/decisions.md`, and `requirements/session-handoff.md` if the final repo state or long-lived decisions changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification if backend code or contracts changed

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.
