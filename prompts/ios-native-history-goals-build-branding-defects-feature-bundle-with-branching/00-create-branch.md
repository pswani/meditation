# 00 Create Branch

Bundle: `ios-native-history-goals-build-branding-defects-feature-bundle-with-branching`

Goal: fix the native iPhone History and Goals defects, restore a working iPhone Xcode build, and rename the app display from `MeditationNative` to `Meditation`.

Before branching:
- Read `AGENTS.md`, `PLANS.md`, `README.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Inspect the likely touched native files:
  - `ios-native/MeditationNative/Features/History/HistoryView.swift`
  - `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
  - `ios-native/MeditationNative/App/ShellViewModel.swift`
  - `ios-native/MeditationNative.xcodeproj/project.pbxproj`
  - `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
  - `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- Create an ExecPlan at `docs/execplan-ios-native-history-goals-build-branding-defects-feature.md`.
- Reserve the review and test outputs:
  - `docs/review-ios-native-history-goals-build-branding-defects-feature.md`
  - `docs/test-ios-native-history-goals-build-branding-defects-feature.md`

Branching steps:
1. Use `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
2. Create `codex/ios-native-history-goals-build-branding-defects-feature-bundle-with-branching`.
3. Record parent and feature branches in the ExecPlan before coding.

Stop and realign if:
- the build failure is actually caused by unrelated in-flight project changes outside this bundle
- the requested History meditation-type change turns out to require a product-level workflow decision that is not inferable from the repo docs

When complete, move to `01-implement-ios-native-history-goals-build-branding-defects.md`.
