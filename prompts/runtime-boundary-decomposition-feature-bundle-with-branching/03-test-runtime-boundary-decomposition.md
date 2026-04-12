# Test: Runtime Boundary Decomposition

Goal:
- verify that the decomposition reduced responsibility sprawl without changing core runtime behavior

Minimum verification:
1. Run the required frontend checks for the touched web runtime surfaces.
2. Run the relevant iOS tests or builds for the touched native shell runtime surfaces.
3. Verify at least one main timer flow and one main iOS shell or sync-facing flow affected by the extraction.
4. Confirm the extracted seams are covered by focused tests where practical.

Suggested command ideas when applicable:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`

Record results in:
- `docs/test-runtime-boundary-decomposition-feature.md`

The test doc should include:
- commands run
- pass or fail status
- which web and iOS runtime flows were verified
- any residual manual verification gaps

When complete:
- summarize the most important verification result
- then continue to `04-fix-runtime-boundary-decomposition.md`
