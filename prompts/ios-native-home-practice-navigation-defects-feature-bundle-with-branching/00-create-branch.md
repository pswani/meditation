# 00 Create Branch

Bundle: `ios-native-home-practice-navigation-defects-feature-bundle-with-branching`

Goal: fix the native iPhone Home and Practice navigation defects around duplicate titles, disabled or missing favorite and `custom play` start actions, and broken back navigation, with offline behavior included in scope.

Before branching:
- Read `AGENTS.md`, `PLANS.md`, `README.md`, `requirements/intent.md`, `docs/product-requirements.md`, `docs/architecture.md`, `docs/ux-spec.md`, `docs/screen-inventory.md`, `requirements/roadmap.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`.
- Inspect the current native shell and the likely touched files:
  - `ios-native/MeditationNative/App/ShellRootView.swift`
  - `ios-native/MeditationNative/App/ShellViewModel.swift`
  - `ios-native/MeditationNative/Features/Home/HomeView.swift`
  - `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
  - `ios-native/MeditationNative/Features/Practice/PracticeOverviewSections.swift`
  - `ios-native/MeditationNative/Features/Practice/CustomPlayLibraryView.swift`
  - `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
  - `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- Create an ExecPlan at `docs/execplan-ios-native-home-practice-navigation-defects-feature.md` before code changes.
- Reserve the review and test outputs:
  - `docs/review-ios-native-home-practice-navigation-defects-feature.md`
  - `docs/test-ios-native-home-practice-navigation-defects-feature.md`

Branching steps:
1. Use `codex/defects-enhancements-16Apr` as the parent branch for this bundle.
2. Create `codex/ios-native-home-practice-navigation-defects-feature-bundle-with-branching`.
3. Record the parent branch, feature branch, and initial findings in the ExecPlan progress log.

Stop and realign if:
- the touched native files already contain unrelated user edits that would make these fixes risky to stack
- the reported defects turn out to require broader audio, build, or History or Goals work that belongs in a different bundle

When this prompt is complete, recommend `01-implement-ios-native-home-practice-navigation-defects.md`.
