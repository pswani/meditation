# Test Report: Native Custom Play Start And Lock-Screen Defects

## Automated verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - Passed on 2026-04-17
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-custom-play-defects CODE_SIGNING_ALLOWED=NO build-for-testing`
  - Passed on 2026-04-17
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' -only-testing:MeditationNativeTests/ShellViewModelPresentationTests -only-testing:MeditationNativeTests/ShellViewModelTests -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO test`
  - Selected suites printed as passed on 2026-04-17, but the overall `xcodebuild` invocation still exited with code 65 after completion because of simulator-run instability

## Focused coverage confirmed
- Standalone Home and Practice `custom play` starts remain enabled when recording media is unavailable, with bells-only fallback messaging instead of a disabled primary action.
- Backend sync now recovers one clear recording match for legacy `custom play` records that arrive without `mediaAssetId`.
- Audio-playback completion now finishes standalone `custom play` sessions without relying on a foreground clock tick, and that path clears notification fallback after one truthful completion.
- The Practice `custom play` library now builds with a wrapped action layout for narrow iPhone widths instead of one overcrowded button row.

## Manual-device QA still needed
- Start a Home favorite and a Practice featured `custom play` whose recording is unavailable on the device, and confirm the session still runs for the saved duration with start or end bells only.
- Start a recording-backed `custom play`, lock the iPhone, and confirm the recording keeps playing when iOS allows background audio.
- Let that locked `custom play` finish while another audio app is already playing, and confirm the saved end bell or notification fallback remains audible without pausing the other app.
