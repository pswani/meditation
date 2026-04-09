Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-sync-polish-feature.md`
- `docs/test-ios-native-sync-polish-feature.md`

Goal:
- Address actionable issues found during review or testing for the native iOS sync and polish milestone.

Rules:
- Stay within the original milestone scope.
- Fix only validated issues from review or testing.
- Keep local-first trust and calm UX intact while refining sync behavior.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Refresh `requirements/decisions.md`, `requirements/session-handoff.md`, and `docs/ios-native/README.md` if the final state changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- run any relevant local backend checks required by the chosen sync scope

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.
