# Test: Native iOS Runtime Safety Hardening Feature

## Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - Passed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-safety CODE_SIGNING_ALLOWED=NO build`
  - Passed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-safety CODE_SIGNING_ALLOWED=NO build-for-testing`
  - Passed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-safety CODE_SIGNING_ALLOWED=NO test`
  - Blocked by the environment
  - Xcode requires a concrete simulator device, but only `Any iOS Simulator Device` is available and CoreSimulator is unavailable

## Coverage
- Confirm-before-end for active timer sessions
- Confirm-before-end for active `custom play` and playlist sessions
- Confirm-before-delete for `custom play` and playlist library items
- Archived-only delete confirmation for `sankalpa`

## Result
- The bundle is functionally complete.
- The only remaining gap is simulator availability for full test execution.
