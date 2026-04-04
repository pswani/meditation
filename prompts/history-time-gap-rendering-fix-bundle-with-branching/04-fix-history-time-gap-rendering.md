Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

Goal:
- Address actionable issues found during review or testing for the History time-gap rendering slice.

Rules:
- Stay within the original slice scope.
- Do not widen into timer-runtime, notification, or log-semantics changes.
- Fix only validated issues from review/test.
- Keep the UI calm and compact.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Update `requirements/session-handoff.md` if the final repo state description needs adjustment.

Required verification after fixes:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.
