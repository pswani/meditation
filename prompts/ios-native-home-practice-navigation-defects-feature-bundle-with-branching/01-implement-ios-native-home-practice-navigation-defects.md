# 01 Implement Native Home And Practice Navigation Defects

Implement the smallest cohesive native iPhone fix slice for these defects:

- Home shows the title twice, especially in offline mode.
- Home favorite shortcuts are disabled, including favorite meditation starts that should be available locally.
- Practice shows the title twice, especially in offline mode.
- Practice `custom play` surfaces do not show or enable the expected `Start` action.
- Practice -> `custom plays` back navigation does not work reliably.

Execution requirements:
- Keep the work local to the native shell, Home, Practice, and `custom play` navigation surfaces.
- Maintain one live, updated ExecPlan at `docs/execplan-ios-native-home-practice-navigation-defects-feature.md`.
- Prefer the smallest UI and view-model changes that restore truthful local-first behavior both online and offline.
- Preserve calm tab-root presentation: one clear screen title, no duplicated route heading stack, and no hover-only behavior.

Likely files:
- `ios-native/MeditationNative/App/ShellRootView.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNative/Features/Home/HomeView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeOverviewSections.swift`
- `ios-native/MeditationNative/Features/Practice/CustomPlayLibraryView.swift`
- focused native tests under `ios-native/MeditationNativeTests/` and `ios-native/Tests/MeditationNativeCoreTests/` if domain logic moves

Acceptance targets:
- Home and Practice each present the title once on iPhone, including offline mode.
- Favorite shortcuts on Home start when the local data and media requirements are satisfied, without being disabled just because backend sync is unavailable.
- Practice exposes an obvious `Start` affordance for `custom play` entries wherever the user expects it, and missing-media messaging stays calm and truthful.
- Navigation into the full `custom play` library preserves a working back path to Practice.
- Existing timer, playlist, and sync presentation behavior does not regress.

Required follow-through:
- Add or update focused tests for the affected presentation and startability rules.
- Update `docs/ios-native/README.md` only if operator or QA guidance changes.
- Update `requirements/session-handoff.md` with the new bundle outcome once the slice is complete.

Do not absorb:
- lock-screen audio or audio-mixing changes
- History, Goals, Xcode build, or app-renaming work
- web defects or backend schema work

When implementation is stable, hand off to `02-review-ios-native-home-practice-navigation-defects.md`.
