Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-home-parity-feature.md`

Review target:
- The branch `codex/ios-native-home-parity-feature-bundle-with-branching` after implementation is complete.

Review focus:
- quick-start trustworthiness
- last-used shortcut correctness
- favorite shortcut clarity
- Home calmness and density on iPhone
- missing tests around shortcut selection or navigation

Priority review questions:
1. Can Home reliably resume or start the intended meditation type?
2. Does the Home surface remain calm instead of becoming crowded?
3. Are favorite and last-used shortcuts scoped to the correct saved entities?
4. Were unrelated Practice, History, or sync areas widened while adding Home parity?

Artifact requirement:
- Create or update `docs/review-ios-native-home-parity-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
