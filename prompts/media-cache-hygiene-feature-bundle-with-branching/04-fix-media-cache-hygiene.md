Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/media-registration-scripts.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-media-cache-hygiene-feature.md`
- `docs/test-media-cache-hygiene-feature.md`

Goal:
- Address actionable issues found during review or testing for the media and cache hygiene phase.

Rules:
- Stay within the original phase scope.
- Do not widen into browser upload/import, backend query redesign, or broad UI refactors.
- Fix only validated issues from review or testing.
- Keep asset ownership, offline behavior, and operator workflow explicit and trustworthy.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests or scripts if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `README.md`, `docs/architecture.md`, `docs/media-registration-scripts.md`, `requirements/decisions.md`, and `requirements/session-handoff.md` if the final repo state or long-lived decisions changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run any focused local smoke checks needed for offline app registration or media lookup behavior

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.

