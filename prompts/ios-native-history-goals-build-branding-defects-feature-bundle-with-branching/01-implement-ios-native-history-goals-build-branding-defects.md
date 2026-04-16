# 01 Implement Native History, Goals, Build, And Branding Defects

Implement the smallest cohesive native slice for these reports:

- the app does not build in Xcode for iPhone
- Goals shows the title twice
- History `Manual log` is disabled or unavailable
- History needs an explicit meditation-type change path
- the app name should display as `Meditation` instead of `MeditationNative`

Execution requirements:
- Keep one active ExecPlan at `docs/execplan-ios-native-history-goals-build-branding-defects-feature.md`.
- Preserve calm, trustworthy History behavior. Any editing affordance must make it clear what is being changed and which `session log` records are eligible.
- Prefer the narrowest explicit solution for the meditation-type change request, and record the chosen interpretation in the ExecPlan decision log.
- Keep the work local to History, Goals, native project configuration, and app-branding surfaces.

Likely files:
- `ios-native/MeditationNative/Features/History/HistoryView.swift`
- `ios-native/MeditationNative/Features/Goals/GoalsView.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- any generated Info.plist or build-setting seams tied to display name and iPhone buildability
- focused native tests under `ios-native/MeditationNativeTests/` and `ios-native/Tests/MeditationNativeCoreTests/`

Acceptance targets:
- Goals presents one title on iPhone.
- History exposes a working `Manual log` action.
- The user can change meditation type through a clear History-screen path that matches the chosen interpretation.
- The app builds again for the iPhone simulator target used by the repo.
- The app display name is `Meditation` wherever the native bundle surfaces it.

Required follow-through:
- Add or update focused tests for the changed History and presentation logic.
- Update `docs/ios-native/README.md` if setup or QA guidance changes.
- Update `requirements/session-handoff.md`, and update `requirements/decisions.md` only if a long-lived native editing or branding decision changes.

Do not absorb:
- Home or Practice favorite-start defects
- lock-screen audio or mixing work
- web manual-log changes
- sankalpa cadence redesign or backend test-isolation work

Hand off to `02-review-ios-native-history-goals-build-branding-defects.md` when implementation is stable.
