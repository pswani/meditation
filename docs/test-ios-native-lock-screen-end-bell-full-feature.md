# Test Report: Native Lock-Screen End-Bell Completion

## Automated verification
- `swift test --package-path ios-native`
  - Passed on 2026-04-17
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' build-for-testing`
  - Passed on 2026-04-17
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' -only-testing:MeditationNativeTests/ShellViewModelTests test`
  - Passed on 2026-04-17
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS' build`
  - Passed on 2026-04-17

## Focused coverage confirmed
- Notification fallback keeps the selected bundled end bell when one is available.
- Near-end inactive/background transitions arm the narrow bridge and reschedule notification fallback slightly later to reduce duplicate-bell risk.
- Bridge-driven timer completion clears active state, writes one completed `session log`, and does not duplicate logs when the app returns active.

## Manual-device QA still needed
- Start a fixed timer with `Temple Bell`, lock the iPhone during the last 25 seconds, and confirm whether the app-driven bell fires before any notification fallback.
- Repeat with `Gong` and confirm the fallback notification uses the selected bell when the app is not kept runnable through completion.
- Lock the phone much earlier in the sit and confirm completion is still truthful:
  - notification fallback or foreground catch-up may happen
  - no copy should imply guaranteed app-driven bell playback after long suspension
- Verify competing-audio behavior on device:
  - another audio app should keep playing
  - timer cues and the end bell should still be audible when iOS allows them to play
