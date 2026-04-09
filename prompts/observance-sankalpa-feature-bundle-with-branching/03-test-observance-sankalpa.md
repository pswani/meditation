Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/session-handoff.md`
- `docs/execplan-observance-sankalpa-feature.md`

Goal:
- Verify the observance-based sankalpa slice thoroughly without widening scope.

Required automated verification:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

Required focused checks:
1. Confirm duration-based and session-count-based sankalpas still pass their existing regression paths.
2. Confirm an observance sankalpa can be created with a label and daily window.
3. Confirm per-date observance status updates round-trip through local state and backend normalization.
4. Confirm future dates remain non-editable while current and past dates can be updated.
5. Confirm observance progress and status handling behave correctly across active, completed, expired, and archived states.
6. Confirm Home can still render the top active sankalpa when the top goal is observance-based.
7. Confirm older sankalpa storage snapshots without observance fields still load safely.

Artifact requirement:
- Create or update `docs/test-observance-sankalpa-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual risks that still need manual validation.
