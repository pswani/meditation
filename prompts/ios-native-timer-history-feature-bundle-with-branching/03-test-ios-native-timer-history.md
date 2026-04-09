Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-timer-history-feature.md`

Goal:
- Verify the native iOS timer and history milestone thoroughly without widening scope.

Required automated verification:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm fixed-duration sessions start and complete correctly.
2. Confirm open-ended sessions show elapsed time and end cleanly.
3. Confirm pause and resume preserve timer correctness.
4. Confirm manual logs can be created with the required validations.
5. Confirm History shows the resulting entries clearly on iPhone-sized screens.
6. Confirm Settings expose only the timer and notification controls needed for this milestone.

Artifact requirement:
- Create or update `docs/test-ios-native-timer-history-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only risk that still needs physical iPhone validation.
