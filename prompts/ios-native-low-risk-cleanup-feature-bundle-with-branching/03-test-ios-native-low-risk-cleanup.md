# Test: iOS Native Low-Risk Cleanup

Goal:
- verify that the cleanup work is real, safe, and proportionate

Minimum verification:
1. Run the smallest relevant native build or test commands for the touched areas.
2. If an Xcode warning was targeted, rerun the exact command that surfaces it.
3. Confirm docs changes match the current repo state.

Suggested commands when applicable:
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Record results in:
- `docs/test-ios-native-low-risk-cleanup-feature.md`

The test doc should include:
- commands run
- pass or fail status
- whether the targeted warning or drift was resolved
- any cleanup intentionally deferred

When complete:
- summarize the most important result
- then continue to `04-fix-ios-native-low-risk-cleanup.md`
