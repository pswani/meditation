# Test: iOS Native Runtime UX And Resilience

Goal:
- verify that recovery, numeric input, and settings behavior are correct and calm

Minimum verification:
1. Run focused native tests that cover restoration, validation, and presentation logic.
2. Run a native build command for the app target.
3. If shared contracts or backend seams changed, run the relevant repo-wide commands:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
4. Record any manual or simulator checks used to validate recovery and form ergonomics.

Suggested native commands when applicable:
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Record results in:
- `docs/test-ios-native-runtime-ux-resilience-feature.md`

The test doc should include:
- commands run
- pass or fail status
- relevant manual checks
- known environment limits, especially around real-device recovery and notifications

When complete:
- summarize the most important result
- then continue to `04-fix-ios-native-runtime-ux-resilience.md`
