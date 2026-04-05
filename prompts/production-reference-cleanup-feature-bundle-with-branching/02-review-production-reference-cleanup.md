Read before review:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-production-reference-cleanup-feature.md`

Review target:
- The branch `codex/production-reference-cleanup-feature-bundle-with-branching` after implementation is complete.

Review focus:
- bugs
- reference-data drift
- config drift
- verification-workflow reliability
- generated-artifact hygiene
- missing test coverage

Priority review questions:
1. Is there now one clear, durable approach for shared reference data, or do parallel definitions still remain?
2. Does the remaining Vite config match the documented runtime and proxy behavior?
3. Do README and durable docs now describe the real repo behavior without stale statements?
4. Are generated artifacts reliably removed from tracking and protected by ignore rules or workflow changes?
5. Is the new single-entry verify path trustworthy and scoped correctly?
6. Were unrelated refactors introduced?
7. Do tests and scripts actually protect the new configuration decisions?

Artifact requirement:
- Create or update `docs/review-production-reference-cleanup-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.

If review discovers a real issue:
- Do not fix it in this step.
- Capture it clearly so the next prompt can address it.

