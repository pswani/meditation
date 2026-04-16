# 02 Review Native Lock-Screen Audio And Mixing Improvements

Review the branch and write `docs/review-ios-native-lock-screen-audio-mixing-feature.md`.

Review focus:
- correctness of the audio-session category and options for the requested mixing behavior
- whether the lock-screen improvement is real or only cosmetic
- regressions to silent-switch playback, recording playback, or notification behavior
- whether docs and tests accurately state any remaining platform limits

Rules:
- Findings first, with file references.
- If the branch is clean, say so explicitly and highlight the remaining real-device verification gaps.
- Do not fix issues in this prompt.

Next prompt: `03-test-ios-native-lock-screen-audio-mixing.md`.
