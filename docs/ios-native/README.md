# Native iOS README

This README is for the native iPhone app track in this repository.

The native iPhone app now lives under `ios-native/` as:
- `MeditationNative.xcodeproj` for the app, unit-test, and UI-test targets
- `Sources/MeditationNativeCore/` for shared native domain, data, and persistence foundations
- `MeditationNative/` for the SwiftUI app shell and destination screens
- `Tests/MeditationNativeCoreTests/` for focused core timer, playback, playlist, validation, and logging tests
- `MeditationNativeUITests/` for launch plus timer, `custom play`, playlist, History, and Settings smoke coverage

Implemented native surfaces today include:
- Practice timer setup for fixed-duration and open-ended sessions
- active timer runtime with pause, resume, and end controls
- `custom play` creation, editing, deletion, favorite handling, and local playback
- `custom play` parity metadata including optional start/end sounds, session notes, and a link-aware media identifier seam for later sync
- `Apply to timer` from the custom-play library so saved playback settings can seed timer defaults
- playlist creation, editing, reordering, favorite handling, and ordered runtime
- web-aligned timer sound choices and bundled timer cue playback using the shared `Temple Bell` and `Gong` audio files
- truthful `custom play` and linked-playlist recording playback:
  - one bundled sample recording ships with the app for local-only use
  - synced backend media metadata now maps to real remote recording URLs instead of placeholder loops
  - missing recordings stay explicit and unavailable instead of silently substituting another sound
- explicit `session log` creation for standalone `custom play` runs and per-item playlist outcomes
- automatic local `session log` creation from timer outcomes
- History filters plus manual log entry
- History status filtering plus explicit playlist-run and `custom play` context
- persisted active-session recovery for timer, `custom play`, and playlist runtime state when the saved session can still be reconstructed truthfully on relaunch
- direct numeric entry for timer duration, interval minutes, and manual-log duration alongside quick-adjust controls
- 1-minute quick-adjust controls for the main timer duration so short-session edits feel precise on iPhone
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
- backend-backed hydration for timer settings, `session log`, `custom play`, playlist, `sankalpa`, and summary data when `MEDITATION_IOS_API_BASE_URL` is configured
- a persisted native sync queue plus sync-status snapshot under Application Support
- calm shell and Settings sync messaging for local-only, syncing, pending-sync, offline, backend-unavailable, and last-sync-success states
- explicit save or reset behavior for Settings timer defaults instead of immediate persistence on every edit
- stale-delete restore notices when a queued backend delete loses reconciliation against a newer `custom play`, playlist, or `sankalpa`

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

Avoid adding large cross-platform dependencies unless future scope clearly justifies them.

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
4. Open:
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
4. Use Xcode's console and debugger first when you are investigating launch, storage, or notification issues.
5. The native app persists local JSON state under Application Support:
   - `MeditationNative/foundation-snapshot.json`
   - `MeditationNative/sync-state.json`
   The foundation snapshot stores timer defaults, local `session log` history, saved `custom play` entries, playlists, `sankalpas`, and a compatibility summary snapshot.
   The sync-state snapshot stores queued native mutations, sync timestamps, connectivity classification, and the last sync notice or error message.
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
xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination "platform=iOS Simulator,name=<Your Installed iPhone Simulator>" build-for-testing
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

Physical iPhone or concrete simulator verification is still recommended for:
- notification permission prompts
- fixed-duration completion notifications
- background or foreground transitions around timer completion
- active-session relaunch recovery for timer, `custom play`, and playlist
- bundled timer cue playback for `Temple Bell` and `Gong`
- bundled-sample and backend-linked recording playback for `custom play` and playlist-linked items
- silent-switch playback for timer cues and recording-backed sessions on physical hardware
- pause or resume behavior when audio playback is interrupted by the system
- Home density and readability on a real iPhone-sized screen
- `sankalpa` editor ergonomics and observance day-menu interactions on a concrete device
- the sync banner and Settings sync copy during real network loss or backend-unavailable states
- physical-device base-URL behavior when the backend runs on the same Mac

## Backend Connectivity Notes

The native app remains usable without backend connectivity.

Optional backend-backed sync is enabled when `MEDITATION_IOS_API_BASE_URL` is configured:

1. Do not use `localhost` from a physical iPhone if the backend is running on your Mac.
2. Use your Mac's LAN IP or a deployed host for physical-device verification.
3. `localhost` remains acceptable for simulator-adjacent tooling on the same machine.
4. Native sync uses the existing backend REST routes rather than a native-only sync endpoint:
   - `/api/settings/timer`
   - `/api/session-logs`
   - `/api/custom-plays`
   - `/api/playlists`
   - `/api/sankalpas`
   - `/api/summaries`
   - `/api/media/custom-plays`
5. Native writes stay local-first and queue for replay when the backend is offline or unavailable.
6. The generated Info.plist now allows local-network HTTP development targets so a physical iPhone can reach a backend running on your Mac by LAN IP without extra app-code changes.
7. The first local-LAN connection on device can still trigger the iOS local-network permission prompt because the app now declares why it needs that access.

## Environment Configuration Seam

The native foundation reads optional process environment values so local runs can point at a backend without changing app code:

- `MEDITATION_IOS_PROFILE`
- `MEDITATION_IOS_API_BASE_URL`

If these are absent, the app stays in the default local-only profile and does not require backend connectivity.

If `MEDITATION_IOS_API_BASE_URL` is present, the app:
- attempts a background refresh on launch and when the scene becomes active
- keeps local edits visible immediately
- persists queued writes under `sync-state.json`
- surfaces calm sync or replay messaging in the shell and Settings
- persists the configured profile and base URL in native defaults so device relaunches stay on the configured backend instead of falling back to the local-only profile

If `MEDITATION_IOS_API_BASE_URL` is explicitly set to an empty value for a run, the app clears the persisted backend configuration and returns to the local-only profile.

The iPhone app also exposes an in-app Settings form for backend configuration:
- save a profile label plus backend base URL directly on the device
- use this for physical-iPhone installs that are not being relaunched from an Xcode run configuration
- for the supported Mac Mini install, enter the nginx app origin such as `http://<Mac-Local-Hostname>.local` or `http://<Mac-LAN-IP>` rather than the loopback-only backend port
- reserve `http://<Mac-LAN-IP>:8080` or similar direct-backend URLs for short-lived debugging only when the backend has been intentionally exposed beyond loopback
- clear the saved backend there when you want to return the phone to intentional local-only mode

There is no in-app destructive wipe for the native local snapshot yet. To clear local test data on a physical iPhone today, delete the app from iOS and reinstall it. The Settings `Clear` button only removes the saved backend configuration and returns the app to local-only mode.

## Practical Working Notes

- Keep the native app separate from the web app rather than embedding the SPA in a web view.
- Prefer local-first persistence until the core experience feels trustworthy on device.
- Preserve the exact product terms already used elsewhere in the repo.
- Keep sample content explicitly labeled as local foundation data until real feature flows replace it.
- Native timer sounds now follow the same selectable contract as the web app:
  - `Temple Bell`
  - `Gong`
  - legacy `Soft Chime` and `Wood Block` values normalize to those labels during hydration
- Native timer cues and recording-backed session playback now activate an `AVAudioSession` playback category before playback so meditation audio can continue even when the iPhone silent switch is on.
- Native `custom play` media is now truthful rather than placeholder-backed:
  - local-only playback uses the bundled `Vipassana Sit (20 min)` sample recording when selected
  - synced backend media metadata maps to its real `/media/custom-plays/...` playback path
  - if no playable recording exists on the device, the app shows calm unavailable-media guidance instead of faking playback
- The native Practice custom-play library includes an explicit `Apply to timer` action that copies the saved `custom play` duration, meditation type, and sounds into the timer defaults.
- Settings timer defaults now use a screen-local draft with explicit `Save` and `Reset` actions, while Practice still behaves like the next-session setup surface.
- Native summary remains derived from local `session log` history instead of introducing a second stored summary source of truth.
- `sankalpa` stays local-first with archive or restore support while optional backend sync remains intentionally additive.
- The native sync seam stays explicit and local-first:
  - queued writes replay through the existing backend routes
  - backend reads merge with device-only bundled sample media and local `sankalpa` titles
  - stale backend delete outcomes restore the current backend record with calm notice copy
- Saved playlist items snapshot the current title, meditation type, and duration from linked `custom play` entries while still retaining a lightweight link for runtime validation.
- Keep the native iOS docs updated when project names, schemes, signing steps, or base-URL rules change.
