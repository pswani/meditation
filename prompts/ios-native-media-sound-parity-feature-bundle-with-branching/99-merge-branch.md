# Merge: iOS Native Media And Sound Parity

Merge only if all prior prompts completed safely.

Pre-merge checklist:
1. review `git status` and `git diff --stat`
2. confirm only in-scope files changed
3. confirm `docs/execplan-ios-native-media-sound-parity-feature.md` exists and is current
4. confirm `docs/review-ios-native-media-sound-parity-feature.md` exists
5. confirm `docs/test-ios-native-media-sound-parity-feature.md` exists
6. confirm durable docs were updated where required

Commit guidance:
- prefer a message like `feat(ios-native): align media and timer sound parity`

Merge guidance:
- use non-interactive git commands only
- do not amend unrelated commits
- do not merge if review findings remain unresolved without explicit sign-off

Final handoff should include:
- commit id
- merge target branch
- main outcomes
- any manual iPhone checks still recommended
