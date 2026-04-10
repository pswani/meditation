Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-history-summary-parity-feature.md`

Review target:
- The branch `codex/ios-native-history-summary-parity-feature-bundle-with-branching` after implementation is complete.

Review focus:
- `session log` truthfulness
- History clarity and grouping correctness
- summary range correctness
- time-of-day bucketing correctness
- migration safety if snapshot schema changed

Priority review questions:
1. Does the richer native `session log` model capture the important contextual data without becoming fragile?
2. Does History stay readable on iPhone after the added fidelity?
3. Do custom summary ranges and time-of-day rows behave correctly across edge cases?
4. Did the implementation preserve calm empty and invalid-range states?
5. Were unrelated sync or Home areas widened prematurely?

Artifact requirement:
- Create or update `docs/review-ios-native-history-summary-parity-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
