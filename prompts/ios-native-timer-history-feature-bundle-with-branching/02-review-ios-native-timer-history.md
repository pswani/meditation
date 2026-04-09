Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-timer-history-feature.md`

Review target:
- The branch `codex/ios-native-timer-history-feature-bundle-with-branching` after implementation is complete.

Review focus:
- timer correctness
- notification or background-timing trustworthiness
- validation regressions
- `session log` accuracy
- History clarity on small screens
- missing tests around risky timer state transitions

Priority review questions:
1. Does the timer preserve correctness across pause, resume, foreground return, and early end?
2. Are validation rules faithful to the product docs?
3. Do auto and manual logs represent the session outcome truthfully?
4. Does the iPhone UI keep the timer flow calm rather than crowded?
5. Were unrelated feature areas touched prematurely?

Artifact requirement:
- Create or update `docs/review-ios-native-timer-history-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
