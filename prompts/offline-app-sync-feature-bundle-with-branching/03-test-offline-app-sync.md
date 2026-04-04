Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/session-handoff.md`
- `docs/execplan-offline-app-sync-feature.md`

Goal:
- Verify the offline-app and backend-reconciliation slice thoroughly without widening scope.

Required automated verification:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- run relevant backend verification if backend code or contracts changed

Required focused checks:
1. Confirm the SPA can reopen from cached assets after a prior successful visit when network access is unavailable.
2. Confirm the shell and feature messaging distinguish:
   - browser offline
   - backend unreachable
   - pending sync
   - failed sync awaiting retry
3. Confirm Home, Practice, History, Goals, and Settings remain usable from local or cached state when the backend is unreachable.
4. Confirm a local write made while the backend is unreachable remains visible immediately and enters the queue safely.
5. Confirm queued writes replay automatically after backend reachability returns.
6. Confirm summary and media-catalog fallback behavior stays calm and explicit.
7. Confirm recording-backed offline media behavior is explicit:
   - cached media keeps working if that is the implemented policy
   - uncached media fails with calm copy if playback is not possible

If practical in the local environment:
- run a focused test command for sync/offline suites in addition to the full test run
- run one browser-style local verification for offline boot and replay behavior

Artifact requirement:
- Create or update `docs/test-offline-app-sync-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused offline and reconciliation check.
- Call out any residual risk that still needs manual validation.
