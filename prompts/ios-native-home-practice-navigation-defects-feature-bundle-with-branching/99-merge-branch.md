# 99 Merge Branch

Merge only if all prior prompts completed safely.

Pre-merge checklist:
- `docs/execplan-ios-native-home-practice-navigation-defects-feature.md` is current.
- `docs/review-ios-native-home-practice-navigation-defects-feature.md` is complete.
- `docs/test-ios-native-home-practice-navigation-defects-feature.md` shows the final verification state.
- Required follow-up fixes are already applied.
- The worktree contains only intended bundle changes.

Merge steps:
1. Review the final diff for scope creep.
2. Commit with a message such as `fix(ios-native): resolve home and practice navigation defects`.
3. Merge the feature branch back into the recorded parent branch with a normal non-destructive merge.
4. Confirm `requirements/session-handoff.md` reflects the completed bundle and any remaining manual QA.

Stop instead of merging if:
- review findings remain unresolved
- verification is incomplete
- the branch picked up unrelated edits
