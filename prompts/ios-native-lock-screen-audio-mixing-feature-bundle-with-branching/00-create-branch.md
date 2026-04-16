# 00 Create Branch

Bundle: `ios-native-lock-screen-audio-mixing-feature-bundle-with-branching`

Goal: improve native iPhone timer-sound behavior so the ending bell is as reliable as possible with the screen locked and while other apps are already playing audio, while staying honest about iOS platform limits.

Before branching:
- Read `AGENTS.md`, `PLANS.md`, `README.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Review the existing native audio and timer evidence:
  - `docs/execplan-ios-native-runtime-device-defects-feature.md`
  - `docs/test-ios-native-runtime-device-defects-feature.md`
  - `docs/test-ios-lock-screen-end-bell-fix-feature.md`
  - `docs/test-ios-lock-screen-end-bell-mitigation.md`
- Inspect the likely touched files:
  - `ios-native/MeditationNative/App/SystemSupport.swift`
  - `ios-native/MeditationNative/App/ShellViewModel.swift`
  - `ios-native/MeditationNative/App/MeditationNativeApp.swift`
  - `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- Create an ExecPlan at `docs/execplan-ios-native-lock-screen-audio-mixing-feature.md`.
- Reserve the review and test outputs:
  - `docs/review-ios-native-lock-screen-audio-mixing-feature.md`
  - `docs/test-ios-native-lock-screen-audio-mixing-feature.md`

Branching steps:
1. Use `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
2. Create `codex/ios-native-lock-screen-audio-mixing-feature-bundle-with-branching`.
3. Record the parent branch and the relevant pre-existing evidence in the ExecPlan.

Stop and realign if:
- the requested behavior would require a product decision about background audio, notification fallback, or competing-audio interruption that is not inferable from the repo docs
- unrelated native playback or sync work is already in progress on the same files

Then continue with `01-implement-ios-native-lock-screen-audio-mixing.md`.
