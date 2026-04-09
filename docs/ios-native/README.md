# Native iOS README

This README is for the native iPhone app track planned for this repository.

The actual Xcode project is expected to be created by the prompt bundle:

- `prompts/ios-native-foundation-feature-bundle-with-branching`

Until that milestone is executed, treat this file as the setup and run guide for the forthcoming `ios-native/` workspace.

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

After milestone 1, the repository should contain something close to:

```text
ios-native/
  MeditationNative.xcodeproj
  MeditationNative/
  MeditationNativeTests/
  MeditationNativeUITests/
```

The exact file names may vary slightly, but the bundle prompts assume:
- project root: `ios-native/`
- main scheme: `MeditationNative`

If milestone 1 chooses a different scheme or project name, update this README and the bundle docs immediately.

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

## Backend Connectivity Notes

Milestones 1 through 4 should not depend on backend connectivity.

When milestone 5 introduces sync:

1. Do not use `localhost` from a physical iPhone if the backend is running on your Mac.
2. Use your Mac's LAN IP or a deployed host instead.
3. Keep the base URL configurable per environment.
4. Document any required local-network permission or ATS exceptions clearly in the app and repo docs.

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
- Keep milestone docs updated when project names, schemes, signing steps, or base-URL rules change.
