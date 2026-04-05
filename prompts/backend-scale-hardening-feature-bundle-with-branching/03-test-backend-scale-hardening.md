Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/session-handoff.md`
- `docs/execplan-backend-scale-hardening-feature.md`

Goal:
- Verify the backend scale and API hardening phase thoroughly without widening scope.

Required automated verification:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Required focused checks:
1. Confirm summary responses remain correct for empty, filtered, and time-zone-aware cases.
2. Confirm sankalpa progress still computes correctly across active, completed, expired, and archived states after the query-path changes.
3. Confirm `session log` filtering or pagination contracts behave predictably and preserve ordering.
4. Confirm History or Goals frontend behavior still works correctly if they were updated to consume the new API contracts.
5. Confirm playlist saves with multiple linked `custom play` items no longer rely on one existence check per item.
6. Confirm the API client handles timeout or cancellation cases with the intended error semantics.
7. Confirm no stale-write or replay regression appears in the touched API paths.

Artifact requirement:
- Create or update `docs/test-backend-scale-hardening-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused backend and API-boundary check.
- Call out any residual risk that still needs manual validation.

