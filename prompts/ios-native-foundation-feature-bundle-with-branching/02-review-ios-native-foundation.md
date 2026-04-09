Read before review:
- `AGENTS.md`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/execplan-ios-native-foundation-feature.md`

Review target:
- The branch `codex/ios-native-foundation-feature-bundle-with-branching` after implementation is complete.

Review focus:
- project structure clarity
- accidental coupling to the web app
- missing domain terminology alignment
- over-scaffolded or premature abstractions
- Xcode runability risks
- missing persistence-boundary tests

Priority review questions:
1. Does the native project stand on its own cleanly under `ios-native/`?
2. Did the shell and structure preserve the product's existing destinations and vocabulary?
3. Is the persistence or environment seam practical without overcommitting to premature backend behavior?
4. Are sample data and previews helpful without masquerading as real implementation?
5. Were unrelated web or backend refactors introduced?

Artifact requirement:
- Create or update `docs/review-ios-native-foundation-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.

If review discovers a real issue:
- Do not fix it in this step.
- Capture it clearly so the next prompt can address it.
