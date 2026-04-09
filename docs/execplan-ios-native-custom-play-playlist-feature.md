# ExecPlan: iOS Native Custom Play And Playlist Feature

## 1. Objective
Add native iPhone `custom play` creation, playback, favorite management, and playlist editing/runtime on top of the existing timer-history slice.

## 2. Why
Milestone 3 is the first native slice that turns Practice into more than a timer screen. It needs to support prerecorded-style sessions and ordered practice flows while keeping the app calm, local-first, and trustworthy on iPhone.

## 3. Scope
Included:
- native `custom play` create, edit, delete, favorite, and start flows
- local media selection for `custom play` entries using bundled placeholder audio for this milestone
- `custom play` runtime with pause, resume, completion, and early stop
- playlist create, edit, delete, favorite, reorder, and optional gap flows
- playlist runtime with explicit current-item state and per-item logging
- focused core tests and practical UI smoke coverage
- durable documentation updates for native milestone 3

Excluded:
- summary
- `sankalpa`
- backend sync
- general iPad redesign
- user-managed media import beyond documented placeholder scope

## 4. Source Documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/ios-native/README.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/ios-native-app-phased-plan.md`
- `prompts/ios-native-app-step-by-step.md`
- `prompts/ios-native-custom-play-playlist-feature-bundle-with-branching/01-implement-ios-native-custom-play-playlist.md`

## 5. Affected Files And Modules
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/ReferenceData.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeView.swift`
- `ios-native/Tests/MeditationNativeCoreTests/DomainModelTests.swift`
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX Behavior
- Practice stays calm on iPhone by keeping setup and library management in one destination with progressive disclosure.
- `custom play` items show a short summary, favorite state, and explicit playability guidance.
- Existing custom plays that predate media support stay visible but non-runnable until edited with a bundled placeholder track.
- `custom play` runtime shows clear pause, resume, and end controls plus concise media guidance.
- Playlist editing supports ordered items, timer versus `custom play` item kinds, optional small gaps, and lightweight reordering without a dense desktop-style layout.
- Playlist runtime shows the current item, upcoming context, and whether the run is in an item or a gap.
- Logging stays explicit:
  - standalone `custom play` runs create one `session log` with source `custom-play`
  - playlist runs create one log per completed item
  - early stop logs only the current in-progress item when it has accrued practice time
  - gap phases never create their own `session log`
- Missing media and invalid playlist references use calm, human-readable messages instead of silent failure.

## 7. Data And State Model
- Extend `CustomPlay` with optional local media metadata so older snapshots remain readable.
- Extend playlist items with explicit `meditation type` and optional `custom play` linkage so runtime and logs stay stable even after later edits.
- Keep local persistence in the existing JSON snapshot store.
- Add local-first runtime state in `ShellViewModel` for:
  - active `custom play`
  - active playlist run
- Use wall-clock-based elapsed tracking with pause bookkeeping, matching the existing timer correctness model.
- Use bundled placeholder audio resources for milestone 3 so simulator and device runs can play local audio without backend dependency.

## 8. Risks
- Xcode project updates must include any new bundled audio resources cleanly.
- Audio playback should not compete with timer cue playback or leave looping audio active after end or pause.
- Existing saved snapshots may lack media metadata; migration must degrade gracefully instead of failing decode.
- Playlist early-stop logging can duplicate or drop logs if the run state machine is unclear.
- UI can become crowded quickly on iPhone if editors are not broken into sheets and concise rows.

## 9. Milestones
1. Extend native core models and helpers for `custom play` media, playlist item metadata, validation, and runtime state.
2. Add `ShellViewModel` support for `custom play` CRUD/runtime and playlist CRUD/runtime plus logging.
3. Rework Practice into calm iPhone management and runtime flows for timer, `custom play`, and playlist journeys.
4. Add focused core tests and UI smoke coverage for the new paths.
5. Update durable docs, then run the required build and test verification.

## 10. Verification
- `swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath /tmp/meditation-ios-custom-play-playlist build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath /tmp/meditation-ios-custom-play-playlist test`
- Review the changed files for scope and correctness
- Ensure the test and review artifacts match the final implemented behavior

## 11. Decision Log
- Use bundled placeholder audio for milestone 3 rather than file import so the native app stays locally runnable without widening into import or sync work.
- Keep pre-media `custom play` records readable by making media metadata optional and surfacing calm “needs media” guidance in the UI.
- Keep playlist logging per item, not one aggregate-only record, so History remains explicit and consistent with the web app’s runtime approach.

## 12. Progress Log
- 2026-04-09: Reviewed bundle prompts, native iOS docs, current timer-history implementation, and existing core models.
- 2026-04-09: Chosen implementation direction: optional media metadata for backward compatibility, bundled placeholder audio for milestone scope, and explicit playlist per-item logging.
- 2026-04-09: Implemented native core model and runtime updates for `custom play` media, playlist linkage, playback, ordering, and logging rules.
- 2026-04-09: Reworked the Practice destination into calm timer, `custom play`, and playlist flows with dedicated library management sheets and runtime cards.
- 2026-04-09: Added focused Swift coverage for `custom play` playback math, playlist ordering, and logging, then verified the core package and generic app build.
