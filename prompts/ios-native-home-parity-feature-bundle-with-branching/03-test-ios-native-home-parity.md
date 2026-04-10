Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-home-parity-feature.md`

Goal:
- Verify the native iOS Home parity slice thoroughly without widening scope.

Required automated verification:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm Home quick start launches the intended timer flow.
2. Confirm Home can start the last used meditation for timer, `custom play`, and playlist cases if implemented.
3. Confirm favorite custom play and playlist shortcuts behave correctly.
4. Confirm recent-session context is readable on an iPhone-sized screen.
5. Confirm Home stays calm when there are no favorites or no recent sessions.

Artifact requirement:
- Create or update `docs/test-ios-native-home-parity-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only risk.
