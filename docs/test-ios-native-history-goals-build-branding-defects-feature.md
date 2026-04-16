# Test: iOS Native History, Goals, Build, And Branding Defects

## Automated checks
- Passed: `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- Passed: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding CODE_SIGNING_ALLOWED=NO build`
- Passed: `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-history-goals-build-branding-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- Passed: `plutil -p /tmp/meditation-ios-history-goals-build-branding/Build/Products/Debug-iphonesimulator/MeditationNative.app/Info.plist | rg 'CFBundleDisplayName|CFBundleName'`
  - Result: `CFBundleDisplayName = Meditation`
  - Result: `CFBundleName = MeditationNative`

## Manual checks
- Not run in this turn: live iPhone-sized UI confirmation for the Goals single-title layout.
- Not run in this turn: tapping through the History `Manual log` flow on a launched simulator or device.
- Not run in this turn: tapping through the manual-log meditation-type change sheet on a launched simulator or device.
- Not run in this turn: inspecting the installed home-screen label on a launched simulator or device.

## Notes
- `swift test --package-path ios-native` remained green after the History editability changes because the new behavior is covered by focused `ShellViewModel` and presentation tests.
- The simulator build and test-build flows both remained healthy after the scoped display-name change, so the Xcode project edits did not spill into target-name, test-host, or bundle-id regressions.
