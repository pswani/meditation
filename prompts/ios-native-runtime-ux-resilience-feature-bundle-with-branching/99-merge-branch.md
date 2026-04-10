# Merge: iOS Native Runtime UX And Resilience

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-ios-native-runtime-ux-resilience-feature.md` exists and is current
4. confirm `docs/review-ios-native-runtime-ux-resilience-feature.md` exists
5. confirm `docs/test-ios-native-runtime-ux-resilience-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `feat(ios-native): improve runtime recovery and timer UX`

Merge guidance:
- use non-interactive git commands only
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- main outcomes
- any recommended real-device follow-up checks
