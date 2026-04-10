# Test: iOS Native Media And Sound Parity

Goal:
- verify the changed media and sound behavior with the strongest practical coverage available in-repo

Minimum verification:
1. Run focused native tests that cover the changed media and sound logic.
2. Run a native build command for the app target.
3. If shared web contracts or assets changed, run the relevant repo-wide commands:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
4. If real-device sound validation is not practical, say so explicitly and explain what remains unverified.

Suggested native commands when applicable:
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Record results in:
- `docs/test-ios-native-media-sound-parity-feature.md`

The test doc should include:
- commands run
- pass or fail status
- any environment limitations
- remaining manual checks for a connected iPhone

When complete:
- summarize the most important result
- then continue to `04-fix-ios-native-media-sound-parity.md`
