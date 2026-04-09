Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-summary-sankalpa-feature.md`
- `docs/test-ios-native-summary-sankalpa-feature.md`

Goal:
- Address actionable issues found during review or testing for the native iOS summary and `sankalpa` milestone.

Rules:
- Stay within the original milestone scope.
- Do not widen into backend sync work.
- Fix only validated issues from review or testing.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Refresh `requirements/decisions.md`, `requirements/session-handoff.md`, and `docs/ios-native/README.md` if the final state changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.
