# ExecPlan: Native Lock-Screen End-Bell Completion

## 1. Objective
Strengthen native iPhone fixed-timer completion behavior so the selected end bell is delivered as reliably and truthfully as iOS allows when the screen locks, while preserving deliberate audio mixing and avoiding duplicate completion state or duplicate `session log` creation.

## 2. Why
The native timer already supports a near-end background bridge plus notification fallback, but the lock-screen completion path still needs a tighter, end-to-end contract:
- fallback should stay aligned with the user's selected end bell where possible
- near-end bridge and notification fallback should be coordinated to reduce duplicate bell risk
- Practice and Settings copy should distinguish guaranteed in-app behavior from best-effort lock-screen behavior

## 3. Scope
Included:
- native fixed-timer completion path and notification scheduling
- scene-phase handling around inactive/background transitions
- duplicate-completion and duplicate-bell coordination
- Practice and Settings copy for truthful lock-screen expectations
- focused native tests and native docs for the slice

Excluded:
- Home, History, Goals, branding, or unrelated native UI defects
- backend or web implementation changes
- broader native architecture refactors outside this runtime path

## 4. Source documents
- `AGENTS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `PLANS.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-lock-screen-end-bell-full-feature-bundle-with-branching/*.md`
- `docs/ios-native/README.md`

## 5. Affected files and modules
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeActiveSections.swift`
- `ios-native/MeditationNative/Features/Settings/SettingsView.swift`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `docs/ios-native/README.md`
- `docs/review-ios-native-lock-screen-end-bell-full-feature.md`
- `docs/test-ios-native-lock-screen-end-bell-full-feature.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- While the app is foregrounded, the on-screen timer remains the source of truth and the selected end bell should fire app-driven at completion.
- When the user locks the phone near the end of a fixed timer, the app should attempt an app-driven completion bell through the existing background bridge.
- When iOS does not keep the app runnable through completion, the app should fall back to a local notification sound rather than claiming guaranteed app-driven lock-screen playback.
- Practice and Settings copy should explain:
  - foreground completion is the strongest guarantee
  - near-end lock-screen completion is best-effort app-driven
  - longer background spans remain iOS-limited and may complete through notification sound or foreground catch-up

## 7. Data and state model
- Keep timer correctness wall-clock based through existing `ActiveTimerSession` timestamps.
- Preserve existing single-source completion state: once `activeSession` is cleared and the log is inserted, later paths must no-op safely.
- Extend notification scheduling input only as needed to carry the selected end sound and any duplicate-risk coordination timing.

## 8. Risks
- iOS scene-phase timing is not fully deterministic during lock, unlock, and interruption flows.
- Rescheduling notification fallback to reduce duplicate bells must not leave the user with no lock-screen signal if the bridge fails.
- Copy must stay truthful and not imply guaranteed background execution beyond what iOS allows.

## 9. Milestones
1. Audit the current completion, notification, and scene-phase path.
2. Implement stronger lock-screen completion coordination with minimal runtime surface changes.
3. Update Practice and Settings copy to reflect the final guarantee and fallback model.
4. Add focused native tests for notification coordination and duplicate-protection paths.
5. Update native docs, review notes, test notes, and durable repo state docs.

## 10. Verification
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' build-for-testing`
- focused XCTest coverage in `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- document remaining real-device lock-screen checks explicitly if they cannot be proven here

## 11. Decision log
- 2026-04-17: Keep the existing `.playback` + `.mixWithOthers` audio-session policy and build on the current near-end bridge rather than replacing it with a broader background-runtime claim.
- 2026-04-17: Favor tighter coordination between the near-end bridge and notification fallback over adding a second completion mechanism.

## 12. Progress log
- 2026-04-17: Reviewed required repo and native docs, inspected current lock-screen completion code, and identified likely slice gaps around selected-bell fallback, duplicate-risk coordination, and clearer lock-screen UX copy.
- 2026-04-17: Implemented selected-bell notification fallback, near-end inactive/background bridge coordination, clearer Practice and Settings copy, and focused XCTest coverage for bridge backup plus duplicate-completion protection.
- 2026-04-17: Verified the slice with SwiftPM tests, simulator build-for-testing, focused app-target XCTest, and a generic iOS device build.
