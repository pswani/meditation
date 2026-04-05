Read before review:
- `AGENTS.md`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-runtime-boundary-hardening-feature.md`

Review target:
- The branch `codex/runtime-boundary-hardening-feature-bundle-with-branching` after implementation is complete.

Review focus:
- bugs
- behavioral regressions
- persistence drift
- hydration or recovery ordering mistakes
- unnecessary rerender fan-out from the new provider boundaries
- route lazy-loading mistakes
- missing or weakened test coverage

Priority review questions:
1. Did the split actually reduce the size and responsibility concentration of the runtime boundary, or did it mostly move complexity around?
2. Are storage-key compatibility, recovery behavior, and offline queue semantics still preserved?
3. Could the new module boundaries introduce stale closures, race conditions, or double persistence writes?
4. Do lazy routes still preserve direct-entry, refresh, and navigation behavior across the primary routes?
5. Were unrelated refactors introduced?
6. Do tests protect the risky parts of the split?

Artifact requirement:
- Create or update `docs/review-runtime-boundary-hardening-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.

If review discovers a real issue:
- Do not fix it in this step.
- Capture it clearly so the next prompt can address it.

