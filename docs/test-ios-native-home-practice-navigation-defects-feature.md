# Test: Native Home And Practice Navigation Defects

## Automated Checks
- Passed: `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- Passed: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects CODE_SIGNING_ALLOWED=NO build`
- Passed: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-practice-navigation-defects-tests CODE_SIGNING_ALLOWED=NO build-for-testing`

## Manual Checks
- Not run in this turn: Home shows one title.
- Not run in this turn: Practice shows one title.
- Not run in this turn: favorite `custom play` shortcuts can start from Home while offline when bundled or cached media is available.
- Not run in this turn: Practice featured and full-library `custom play` flows expose a working `Start` action.
- Not run in this turn: Practice -> `custom plays` -> back returns cleanly to Practice.

## Notes
- Focused native tests now cover the shared `custom play` startability rules for locally playable favorites and unavailable recording media.
- Remaining confidence gap is limited to manual UI confirmation on a live simulator or device.

Recommended next prompt: `04-fix-ios-native-home-practice-navigation-defects.md`
