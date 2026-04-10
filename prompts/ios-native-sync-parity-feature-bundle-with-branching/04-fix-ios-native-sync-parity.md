Read before fixing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-sync-parity-feature.md`
- `docs/test-ios-native-sync-parity-feature.md`

Goal:
- Address actionable issues found during review or testing for the native iOS sync-parity slice.

Rules:
- Stay within the original slice scope.
- Do not widen into unrelated product redesign while fixing sync defects.
- Fix only validated issues from review or testing.

Required follow-through:
1. Implement only the necessary corrections.
2. Update focused tests if the fixes change expected behavior.
3. Re-run the relevant verification commands.
4. Refresh `requirements/decisions.md`, `requirements/session-handoff.md`, and `docs/ios-native/README.md` if the final state changed.
5. Refresh the review and test artifacts if they would otherwise describe stale behavior.

Required verification after fixes:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- relevant local backend verification commands for this repo if native sync is wired to them

Output requirements:
- List the issues addressed.
- List the final verification results.
- State any remaining non-blocking risk.
