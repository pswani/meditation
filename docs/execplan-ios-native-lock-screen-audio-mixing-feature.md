# ExecPlan: iOS Native Lock-Screen Audio Mixing

## 1. Objective
Improve native iPhone timer-sound behavior so fixed-session completion is more reliable when the screen is locked, and let timer or `custom play` audio play while another app is already producing audio.

## 2. Why
- A timer end bell that disappears when the phone locks weakens trust in the native timer.
- The current playback audio session favors silent-switch support, but it likely interrupts competing audio instead of mixing intentionally.
- The app should improve lock-screen behavior without overstating what iOS can guarantee once the app is suspended.

## 3. Scope
Included:
- choose and document one explicit native playback audio-session policy for timer cues and recording-backed playback
- add the smallest truthful timer-completion bridge that can improve near-end lock-screen behavior for fixed timers
- preserve existing notification fallback and foreground recovery
- add focused automated coverage for the chosen audio policy and timer-completion handling
- update durable native docs plus bundle review and test artifacts

Excluded:
- Home, Practice, History, or Goals UI defect work
- broader native runtime redesign
- backend or web changes
- unrelated Xcode project cleanup unless audio capability changes become strictly necessary

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
- `docs/execplan-ios-native-runtime-device-defects-feature.md`
- `docs/test-ios-native-runtime-device-defects-feature.md`
- `docs/test-ios-lock-screen-end-bell-fix-feature.md`
- `docs/test-ios-lock-screen-end-bell-mitigation.md`
- `prompts/ios-native-lock-screen-audio-mixing-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-lock-screen-audio-mixing-feature-bundle-with-branching/01-implement-ios-native-lock-screen-audio-mixing.md`

## 5. Affected files and modules
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellRootView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNativeTests/SystemSupportTests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-lock-screen-audio-mixing-feature.md`
- `docs/test-ios-native-lock-screen-audio-mixing-feature.md`

## 6. UX behavior
- Timer and `custom play` playback should continue to sound intentional when another app is already playing audio, without abruptly pausing that competing audio.
- Fixed timers should keep the current local-notification fallback for lock-screen completion.
- When a fixed timer is very close to ending as the app backgrounds, the app should try to bridge that final stretch so the selected end bell can still fire from the app if iOS allows it.
- Docs and test notes must state clearly that longer background periods can still fall back to the system notification sound or foreground catch-up instead of promising guaranteed lock-screen bell playback.

## 7. Data and state model
- No persisted domain-model changes are expected.
- Add a runtime-only native seam for a near-end timer completion bridge that arms when the app backgrounds with a fixed timer close to completion.
- Keep timer completion local-first, with notification scheduling and history logging behavior unchanged at the persistence boundary.

## 8. Risks
- A mixing audio policy can make the timer bell less dominant if the other app is loud, so the docs need to explain the tradeoff honestly.
- Background-task bridging is time-limited by iOS and must stay narrow to avoid implying a general background-runtime guarantee.
- Scene-phase handling must avoid duplicate completion when a background bridge and the normal foreground clock path overlap.
- Audio-session changes must not regress silent-switch playback or recording-backed `custom play` sessions.

## 9. Milestones
1. Inspect existing native audio, notification, and timer-completion seams plus the prior device-evidence docs.
2. Implement an explicit native playback audio policy and a narrow fixed-timer background completion bridge.
3. Add focused automated coverage for the policy and the background completion handling.
4. Update native docs, then run the required native verification commands.
5. Review the branch, fix any remaining scoped issues, and merge back into the recorded parent branch if verification is clean.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-lock-screen-audio-mixing CODE_SIGNING_ALLOWED=NO build`
- manual physical-iPhone follow-up if available:
  - start a fixed timer with an end sound, lock the screen near completion, and observe whether the selected end bell fires or the system notification carries completion
  - repeat while another audio app is already playing
  - verify `custom play` audio now mixes instead of interrupting the competing audio

## 11. Decision log
- 2026-04-16: Record `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
- 2026-04-16: Use the earlier runtime-device audio work and the older lock-screen mitigation test notes as the pre-existing evidence baseline for this slice.
- 2026-04-16: Use `.playback` with `.mixWithOthers` for native timer cues and recording-backed playback so the app stays audible without automatically pausing the competing audio app.
- 2026-04-16: Limit the native lock-screen bridge to fixed timers that background within roughly 25 seconds of completion, and keep longer background spans on the existing notification-plus-foreground-catch-up path.

## 12. Progress log
- 2026-04-16: Reviewed the required repo docs, the bundle runner, the lock-screen audio prompt sequence, the prior native runtime-device defects ExecPlan, and the existing lock-screen mitigation test notes.
- 2026-04-16: Confirmed the requested parent branch was `codex/defects-enhancements-16Apr` and created `codex/ios-native-lock-screen-audio-mixing-feature-bundle-with-branching`.
- 2026-04-16: Inspected the current native audio-session helper, notification scheduling seam, scene-phase handling, timer completion flow, and current app-target tests to identify the smallest truthful implementation path.
- 2026-04-16: Implemented the mixed native playback-session policy plus a near-end fixed-timer background bridge, and kept longer lock-screen spans explicitly on notification fallback and foreground catch-up.
- 2026-04-16: Added focused app-target coverage for the playback policy and background-bridge completion path, updated the native README plus durable repo docs, and verified the slice with `swift test --package-path ios-native`, simulator `xcodebuild ... build`, and simulator `xcodebuild ... build-for-testing`.
