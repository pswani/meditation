# ExecPlan: iOS Native Runtime Device Defects

## 1. Objective
Fix four reported native iPhone defects affecting timer duration controls, numeric-keyboard dismissal, backend connectivity configuration, and audio playback while the hardware silent switch is enabled.

## 2. Why
- The current timer quick-adjust control moves in 5-minute jumps, which is clumsy for common setup changes.
- The numeric keypad can remain stuck onscreen after editing a timer duration field, which makes the flow feel broken.
- Native backend sync currently depends too much on transient launch-time environment state, so physical-device runs can fall back to `local-only` messaging even when a backend was intended.
- Timer cues can fail to play when the device mute switch is on, which undermines trust in a meditation timer.

## 3. Scope
Included:
- change timer duration quick-adjust step size from 5 minutes to 1 minute in the timer setup and timer-defaults flow
- dismiss the numeric keyboard when the user taps elsewhere in the touched timer entry flows
- add the smallest durable native backend configuration seam so a configured base URL survives normal device relaunches
- allow native local-network HTTP backend access where appropriate for physical-device development
- ensure timer and meditation playback activates an audio session that plays under silent mode
- add focused native tests where practical
- update durable docs for the new configuration and runtime behavior

Excluded:
- new build-and-deploy automation
- unrelated media-parity or navigation work
- broader redesign of timer or settings UX
- backend product-surface changes beyond existing sync routes

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/ios-native/README.md`
- `docs/ios-native/parity-review-2026-04-10.md`
- `prompts/ios-native-runtime-device-defects-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-runtime-device-defects-feature-bundle-with-branching/01-implement-ios-native-runtime-device-defects.md`

## 5. Affected files and modules
- `ios-native/MeditationNative/Components/TimerDraftForm.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/MeditationNative/Features/Settings/SettingsView.swift`
- `ios-native/MeditationNative/Features/History/HistoryView.swift` if manual-log focus or step behavior must stay coherent
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/MeditationNativeApp.swift`
- `ios-native/Sources/MeditationNativeCore/Data/AppEnvironment.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `ios-native/Tests/MeditationNativeCoreTests/DomainModelTests.swift`
- `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Timer duration quick-adjust buttons should move in 1-minute steps, while direct numeric entry still works.
- After editing a timer duration field, tapping elsewhere in the screen should dismiss the number pad cleanly.
- A device that has previously been launched with a valid backend base URL should keep using that configured backend on later launches unless the configuration is explicitly cleared.
- The shell and Settings screens should still distinguish:
  - local-only by choice
  - configured and syncing
  - configured but backend unavailable
- Timer cues and meditation playback should sound intentional even when the mute switch is enabled.

## 7. Data and state model
- Add a lightweight persisted native environment preference for the optional backend base URL and profile name, separate from the existing foundation snapshot and sync-state snapshot.
- Treat launch-environment values as authoritative when present, and persist them for later app launches.
- Allow an explicit empty configured base URL to clear the persisted backend configuration.
- Keep sync-state and app-snapshot contracts otherwise unchanged.

## 8. Risks
- Persisting backend configuration could make it harder to reason about when the app is intentionally local-only unless the docs and UI stay explicit.
- ATS or local-network allowances need to stay narrowly scoped to development behavior rather than becoming a vague arbitrary-loads policy.
- Global keyboard-dismiss gestures can accidentally interfere with buttons or other controls if attached too broadly.
- Audio-session changes can affect how the app interacts with other audio on the device if the category is chosen too aggressively.

## 9. Milestones
1. Add the ExecPlan and inspect the touched timer, environment, and audio seams.
2. Implement 1-minute timer stepping plus clean tap-away keyboard dismissal in the native timer forms.
3. Add a durable native backend-configuration seam and any required local-network transport allowance for physical-device development.
4. Centralize playback-audio-session activation so timer cues and meditation playback work under silent mode.
5. Add focused tests, update docs, and run proportionate verification.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-runtime-device-defects CODE_SIGNING_ALLOWED=NO build`
- manual follow-up if available:
  - confirm 1-minute stepping on iPhone-sized UI
  - confirm tap-away keyboard dismissal on duration editing
  - confirm configured backend state persists across app relaunch on device
  - confirm timer or meditation audio still plays with the mute switch enabled

## 11. Decision log
- 2026-04-10: Use a small persisted native environment seam instead of relying only on transient `ProcessInfo` environment values so physical-device launches remain configured after leaving Xcode.
- 2026-04-10: Keep the timer duration step change narrow to timer setup and timer-defaults duration fields rather than changing every minute stepper in the app.
- 2026-04-10: Prefer a centralized playback audio-session activator so timer cues and meditation playback follow one silent-mode policy.

## 12. Progress log
- 2026-04-10: Reviewed the required repo docs, the new runtime-device-defects prompt bundle, the native iOS README, and the parity review.
- 2026-04-10: Confirmed `codex/ios` is clean and created `codex/ios-native-runtime-device-defects-feature-bundle-with-branching`.
- 2026-04-10: Inspected the native timer form, Practice and Settings views, `AppEnvironment`, shell sync presentation, sync client, and audio support code to identify the smallest implementation seams for the four reported defects.
- 2026-04-10: Implemented 1-minute timer duration stepping, keyboard dismissal support for the touched numeric-entry flows, persisted native backend configuration with an explicit clear path, local-network ATS allowance, and centralized playback audio-session activation.
- 2026-04-10: Verified the slice with `swift test --package-path ios-native`, simulator `xcodebuild ... build`, and simulator `xcodebuild ... build-for-testing`, then documented the results and durable operational notes.
