# Native iOS README

This README is for the native iPhone app track in this repository.

The milestone-1 foundation, milestone-2 timer-history journey, milestone-3 `custom play` plus playlist slice, and milestone-4 summary plus `sankalpa` slice now exist under `ios-native/` as:
- `MeditationNative.xcodeproj` for the app, unit-test, and UI-test targets
- `Sources/MeditationNativeCore/` for shared native domain, data, and persistence foundations
- `MeditationNative/` for the SwiftUI app shell and destination screens
- `Tests/MeditationNativeCoreTests/` for focused core timer, playback, playlist, validation, and logging tests
- `MeditationNativeUITests/` for launch plus timer, `custom play`, playlist, History, and Settings smoke coverage

Implemented native surfaces through milestone 4 now include:
- Practice timer setup for fixed-duration and open-ended sessions
- active timer runtime with pause, resume, and end controls
- `custom play` creation, editing, deletion, favorite handling, and local playback
- `custom play` parity metadata including optional start/end sounds, session notes, and a link-aware media identifier seam for later sync
- `Apply to timer` from the custom-play library so saved playback settings can seed timer defaults
- playlist creation, editing, reordering, favorite handling, and ordered runtime
- bundled placeholder audio for local `custom play` playback without backend sync or file import
- explicit `session log` creation for standalone `custom play` runs and per-item playlist outcomes
- automatic local `session log` creation from timer outcomes
- History filters plus manual log entry
- History status filtering plus explicit playlist-run and `custom play` context
- Goals summary with custom date ranges and by-time-of-day breakdowns
- Home quick start, last-used meditation, favorite shortcut, and recent-session context on iPhone
- Home progress context with today totals, recent session signal, and an active `sankalpa` snapshot
- summary views derived from local `session log` history with all-time, 7-day, 30-day, and custom range filters
- local-first `sankalpa` creation, editing, archive, restore, and progress sections
- `observance-based` `sankalpa` check-ins with explicit `Pending`, `Observed`, and `Missed` states
- Settings support for timer defaults and notification permission messaging
- runtime-safety confirmation flows for ending active timer, `custom play`, and playlist sessions
- shared confirmation prompts for deleting `custom play` and playlist library items
- archived-only delete support for `sankalpa`

## Goal

Build a separate native iOS client for the meditation product that:
- preserves the current product terminology
- feels calm and minimal on iPhone
- works locally on device before backend sync is required
- can later connect to the existing backend intentionally

## Recommended Native Stack

- Swift
- SwiftUI
- SwiftData or another documented Apple-native persistence layer
- AVFoundation for audio playback
- UserNotifications for timer completion and reminder behavior where needed
- XCTest for unit and UI tests

Avoid adding large cross-platform dependencies unless a milestone clearly justifies them.

## Expected Project Shape

Current native workspace shape:

```text
ios-native/
  Package.swift
  MeditationNative.xcodeproj
  MeditationNative/
  Sources/MeditationNativeCore/
  Tests/MeditationNativeCoreTests/
  MeditationNativeUITests/
```

Project and scheme:
- project root: `ios-native/`
- Xcode project: `ios-native/MeditationNative.xcodeproj`
- main scheme: `MeditationNative`
- minimum intended runtime: iPhone-first on iOS 17+

## Xcode Setup

1. Install the latest stable Xcode that supports your current iPhone and simulator runtime.
2. Open Xcode once and accept any required components.
3. Sign in with your Apple ID in Xcode if you plan to run on a physical iPhone:
   - `Xcode` -> `Settings` -> `Accounts`
4. After milestone 1 creates the project, open:
   - `ios-native/MeditationNative.xcodeproj`
5. Select the main app target.
6. Set:
   - Team
   - bundle identifier
   - deployment target appropriate for your device plan
7. Confirm the main scheme is shared and selected.

## Running In Simulator

1. In Xcode, choose an installed iPhone simulator.
2. Build and run the app with `Product` -> `Run`.
3. If the app uses local persistence, delete the app from the simulator between major data-model iterations when a migration is not yet implemented.
4. Use Xcode's console and debugger first when the milestone prompts mention launch, storage, or notification issues.
5. The native app persists one local JSON snapshot under Application Support:
   - `MeditationNative/foundation-snapshot.json`
   This now stores timer defaults, local `session log` history, saved `custom play` entries, playlists, `sankalpas`, and a compatibility summary snapshot for the native milestone-4 journey.
   Delete the app from simulator if you want to reseed the sample foundation data cleanly.

## Running On Your iPhone

1. Connect your iPhone to your Mac with a cable the first time.
2. Trust the computer on the device if prompted.
3. In Xcode, choose your iPhone as the run destination.
4. Let Xcode resolve signing issues before trying to debug runtime behavior.
5. If iOS blocks the app because the developer is untrusted, approve the signing profile on the device under:
   - `Settings` -> `Privacy & Security`
   - or `Settings` -> `General` -> `VPN & Device Management`
   depending on your iOS version

## Build And Test Commands

Use an installed simulator destination on your machine. Example shape:

```bash
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination "platform=iOS Simulator,name=<Your Installed iPhone Simulator>" build
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination "platform=iOS Simulator,name=<Your Installed iPhone Simulator>" test
```

If you do not know the exact simulator name, list available destinations in Xcode or with:

```bash
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -showdestinations
```

For the shared core package, you can also run:

```bash
SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache \
CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache \
swift test --package-path ios-native
```

This validates the foundation models, sample data, and local persistence helper on a machine where the Swift command-line toolchain is healthy.

For the current milestone-4 state, physical iPhone or concrete simulator verification is still recommended for:
- notification permission prompts
- fixed-duration completion notifications
- background or foreground transitions around timer completion
- bundled placeholder audio output for `custom play` and playlist-linked recording items
- pause or resume behavior when audio playback is interrupted by the system
- Home density and readability on a real iPhone-sized screen
- `sankalpa` editor ergonomics and observance day-menu interactions on a concrete device

## Backend Connectivity Notes

Milestones 1 through 4 should not depend on backend connectivity.

When milestone 5 introduces sync:

1. Do not use `localhost` from a physical iPhone if the backend is running on your Mac.
2. Use your Mac's LAN IP or a deployed host instead.
3. Keep the base URL configurable per environment.
4. Document any required local-network permission or ATS exceptions clearly in the app and repo docs.

## Environment Configuration Seam

The native foundation reads optional process environment values so later milestones can point at a backend without changing launch behavior:

- `MEDITATION_IOS_PROFILE`
- `MEDITATION_IOS_API_BASE_URL`

If these are absent, the app stays in the default local-only profile and does not require backend connectivity.

## Suggested Milestone Order

1. `ios-native-foundation-feature-bundle-with-branching`
2. `ios-native-timer-history-feature-bundle-with-branching`
3. `ios-native-custom-play-playlist-feature-bundle-with-branching`
4. `ios-native-summary-sankalpa-feature-bundle-with-branching`
5. `ios-native-sync-polish-feature-bundle-with-branching`

## Practical Working Notes

- Keep the native app separate from the web app rather than embedding the SPA in a web view.
- Prefer local-first persistence until the core experience feels trustworthy on device.
- Preserve the exact product terms already used elsewhere in the repo.
- Keep sample content explicitly labeled as local foundation data until real feature flows replace it.
- Milestone 3 intentionally uses bundled placeholder audio for native `custom play` playback instead of widening into file import or backend media sync.
- Milestone 3 also keeps `custom play` start/end sounds, session notes, and the linked media identifier as optional local-first metadata so the richer model stays readable before sync lands.
- The native Practice custom-play library includes an explicit `Apply to timer` action that copies the saved `custom play` duration, meditation type, and sounds into the timer defaults.
- Milestone 4 keeps native summary derived from local `session log` history instead of introducing a second stored summary source of truth.
- Milestone 4 keeps `sankalpa` status local-first with archive or restore support while leaving backend sync for milestone 5.
- Saved playlist items snapshot the current title, meditation type, and duration from linked `custom play` entries while still retaining a lightweight link for runtime validation.
- Keep milestone docs updated when project names, schemes, signing steps, or base-URL rules change.
