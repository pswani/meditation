Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-sync-parity-feature.md`

Review target:
- The branch `codex/ios-native-sync-parity-feature-bundle-with-branching` after implementation is complete.

Review focus:
- data-loss risk
- stale-write or conflict behavior
- offline and backend-unreachable UX clarity
- boundary cleanliness between UI, persistence, queueing, and API code
- missing tests on reconciliation hot paths

Priority review questions:
1. Can native local edits be lost or overwritten silently?
2. Are backend-unreachable and fully offline states distinguished clearly enough?
3. Does the native sync boundary stay explicit rather than leaking network code across views?
4. Are there untested reconciliation or retry edge cases that could damage trust?
5. Were backend contract changes introduced without sufficient justification or documentation?

Artifact requirement:
- Create or update `docs/review-ios-native-sync-parity-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
