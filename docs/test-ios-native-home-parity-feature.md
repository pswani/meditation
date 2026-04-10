# Test: Native iOS Home Parity Feature

## Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - Passed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-parity CODE_SIGNING_ALLOWED=NO build`
  - Passed
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-home-parity CODE_SIGNING_ALLOWED=NO test`
  - Blocked by the environment
  - Xcode requires a concrete simulator device, but only `Any iOS Simulator Device` is available and CoreSimulator is unavailable

## Focused Checks
- Timer quick start from Home
  - Covered by `MeditationNativeUITests.testHomeQuickStartStartsTheTimerFlow`
  - Not executed here because the simulator-backed test command is blocked
- Last-used shortcut launches timer, `custom play`, and playlist paths
  - Covered by `ShellViewModelTests.testLastUsedTimerShortcutStartsThePersistedTimerDraft`
  - Covered by `ShellViewModelTests.testLastUsedCustomPlayShortcutStartsTheSavedCustomPlay`
  - Covered by `ShellViewModelTests.testLastUsedPlaylistShortcutStartsTheSavedPlaylist`
  - The timer path is also covered by `MeditationNativeUITests.testHomeLastUsedShortcutStartsTheTimerFlow`
  - The UI checks were not executed here because the simulator-backed test command is blocked
- Favorite shortcuts remain readable and startable
  - Covered by `ShellViewModelTests.testHomeShortcutStateStaysCompactAndSorted`
  - Covered by `MeditationNativeUITests.testHomeFavoriteCustomPlayShortcutStartsTheCustomPlayFlow`
  - Covered by `MeditationNativeUITests.testHomeFavoritePlaylistShortcutStartsThePlaylistFlow`
  - The UI checks were not executed here because the simulator-backed test command is blocked
- Recent-session context stays calm on an iPhone-sized screen
  - Covered by `ShellViewModelTests.testHomeShortcutStateStaysCompactAndSorted`
  - UI execution was not possible here because the simulator-backed test command is blocked

## Result
- The bundle is functionally complete.
- The only remaining gap is simulator availability for full UI test execution.
