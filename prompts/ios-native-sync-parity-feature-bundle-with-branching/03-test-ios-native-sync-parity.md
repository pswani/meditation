Read before testing:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-sync-parity-feature.md`

Goal:
- Verify the native iOS sync-parity slice thoroughly without widening scope.

Required automated verification:
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination '<installed iPhone simulator destination>' test`
- relevant local backend verification commands for this repo if native sync is wired to them

Required focused checks:
1. Confirm the app can read backend-backed state when configured with a reachable API base URL.
2. Confirm local-first fallback still works when the backend is unavailable.
3. Confirm pending-sync or failed-sync messaging is calm and explicit.
4. Confirm representative create, update, and delete flows reconcile correctly.
5. Confirm simulator and physical-device base-URL guidance remains accurate.

Artifact requirement:
- Create or update `docs/test-ios-native-sync-parity-feature.md` with concise verification results.

Output requirements:
- Report pass or fail for each required command.
- Report pass or fail for each focused check.
- Call out any residual device-only or environment-specific risk.
