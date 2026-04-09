Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-summary-sankalpa-feature.md`

Review target:
- The branch `codex/ios-native-summary-sankalpa-feature-bundle-with-branching` after implementation is complete.

Review focus:
- summary correctness
- goal-validation correctness
- observance-state trustworthiness
- Home-screen calmness on iPhone
- missing tests for `sankalpa` calculations

Priority review questions:
1. Do summaries reflect the same product meaning as the existing web app?
2. Are `sankalpa` validations faithful to the repo requirements?
3. Are observance check-ins explicit and trustworthy instead of feeling like a generic habits app?
4. Does Home stay useful without becoming cluttered?
5. Were unrelated sync or backend assumptions introduced too early?

Artifact requirement:
- Create or update `docs/review-ios-native-summary-sankalpa-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
