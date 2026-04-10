# Merge: iOS Native Build Deploy And Docs

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-ios-native-build-deploy-docs-feature.md` exists and is current
4. confirm `docs/review-ios-native-build-deploy-docs-feature.md` exists
5. confirm `docs/test-ios-native-build-deploy-docs-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `chore(ios-native): add build deploy workflow and docs`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- main outcomes
- any physical-device limitations still requiring manual follow-up
