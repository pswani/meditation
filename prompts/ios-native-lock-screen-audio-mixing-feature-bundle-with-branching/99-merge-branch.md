# 99 Merge Branch

Merge only if the audio-policy branch is clean, reviewed, and documented honestly.

Pre-merge checklist:
- `docs/execplan-ios-native-lock-screen-audio-mixing-feature.md` is current.
- `docs/review-ios-native-lock-screen-audio-mixing-feature.md` is complete.
- `docs/test-ios-native-lock-screen-audio-mixing-feature.md` records both automated and any manual-device outcomes.
- Any remaining platform limit is documented rather than silently ignored.

Merge steps:
1. Review the final diff for unintended project-file churn.
2. Commit with a message such as `fix(ios-native): harden lock-screen audio and mixing behavior`.
3. Merge back into the recorded parent branch.
4. Confirm `requirements/session-handoff.md` captures the completed slice and any remaining real-device QA gaps.

Do not merge if the branch still overstates lock-screen guarantees or lacks clear competing-audio behavior.
