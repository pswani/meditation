# 03 Test Native Lock-Screen End-Bell Completion

Run the most relevant verification for the native lock-screen end-bell slice.

Required verification:
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' build-for-testing`
- any focused native test commands added for this slice
- if practical in this environment, one device-targeted build or equivalent native build verification

Also verify:
- no duplicate completion state in automated tests
- no duplicate `session log` creation from overlapping completion paths
- audio-session policy tests reflect the intended competing-audio behavior

Manual QA notes:
- If real lock-screen behavior cannot be fully proven in this environment, document the exact remaining real-device checks still needed.

Artifacts:
- Update `docs/test-ios-native-lock-screen-end-bell-full-feature.md` with results.

When verification is complete, continue with `04-fix-ios-native-lock-screen-end-bell-full.md`.
