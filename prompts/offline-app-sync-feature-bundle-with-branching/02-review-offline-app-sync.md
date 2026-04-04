Read before review:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-offline-app-sync-feature.md`

Review target:
- The branch `codex/offline-app-sync-feature-bundle-with-branching` after the implementation step is complete.

Review focus:
- bugs
- behavioral regressions
- cache invalidation mistakes
- backend-reachability false positives or false negatives
- sync replay safety
- misleading offline or degraded-state UX
- missing test coverage

Priority review questions:
1. Can the app now reopen from a cached shell after a successful online load?
2. Does the app distinguish offline from backend-unreachable states clearly enough to guide sync behavior and user messaging?
3. Could the new reachability logic accidentally spam probes, block sync forever, or replay too aggressively?
4. Do existing queue safety guarantees still hold for timer settings, `session log`, `custom play`, playlist, and `sankalpa` writes?
5. Is offline media behavior for recording-backed sessions explicit and trustworthy rather than broken or misleading?
6. Were unrelated refactors introduced?
7. Do tests actually protect the new offline and reconciliation behavior?

Artifact requirement:
- Create or update `docs/review-offline-app-sync-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.

If review discovers a real issue:
- Do not fix it in this step.
- Capture it clearly so the next prompt can address it.
