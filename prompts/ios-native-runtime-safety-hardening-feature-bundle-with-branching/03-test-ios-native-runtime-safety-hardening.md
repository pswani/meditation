Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-runtime-safety-hardening-feature.md`

Goal:
- Verify the native iOS runtime-safety hardening slice thoroughly without widening scope.

Required automated verification:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`

Required focused checks:
1. Confirm ending an active timer requires explicit confirmation.
2. Confirm ending an active `custom play` requires explicit confirmation.
3. Confirm ending an active playlist requires explicit confirmation.
4. Confirm deleting a `custom play` or playlist requires explicit confirmation.
5. Confirm archived `sankalpa` delete is available only where intended.
6. Confirm the added UI still feels calm on an iPhone-sized screen.

Artifact requirement:
- Create or update `docs/test-ios-native-runtime-safety-hardening-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only risk.
