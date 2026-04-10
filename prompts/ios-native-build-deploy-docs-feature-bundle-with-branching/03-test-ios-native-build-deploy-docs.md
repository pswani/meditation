# Test: iOS Native Build Deploy And Docs

Goal:
- verify that the scripted build and deploy workflow works as documented

Minimum verification:
1. Run the new script entry points with safe local arguments.
2. Run the underlying native build command directly at least once.
3. Confirm the README examples match the actual script interface.
4. If physical-device deployment cannot be completed in the environment, say exactly which step remains unverified.

Suggested commands when applicable:
- native script help or dry-run commands
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Record results in:
- `docs/test-ios-native-build-deploy-docs-feature.md`

The test doc should include:
- commands run
- pass or fail status
- environment assumptions
- any physical-device limitations

When complete:
- summarize the most important result
- then continue to `04-fix-ios-native-build-deploy-docs.md`
