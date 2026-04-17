# ExecPlan: iOS Native Custom Play Start And Lock-Screen Defects

## 1. Objective
Fix the remaining native iPhone defects where favorite `custom play` starts stay disabled, the Practice `custom play` library crowds the obvious `Start` action on narrow screens, and `custom play` completion bells can be lost when the phone locks.

## 2. Why
- Favorite shortcuts are part of the fast-start promise, so disabled starts on Home immediately weaken trust.
- The Practice `custom play` library should keep the primary action visible on iPhone rather than burying it behind a cramped action row.
- A `custom play` that keeps timing while the phone locks should still finish truthfully, including the end bell or a system fallback when app-driven playback cannot complete.

## 3. Scope
Included:
- native `custom play` startability rules for Home and Practice
- bells-only fallback when saved `custom play` recording media is unavailable
- responsive iPhone action layout for the Practice `custom play` library
- better native recovery of backend `custom play` media links when the backend omits `mediaAssetId` but the media catalog still has one clear match
- lock-screen-safe `custom play` completion handling, notification fallback reuse, and required project capability updates

Excluded:
- unrelated timer, History, Goals, or branding work
- backend schema changes
- web changes
- broader playlist redesign beyond any shared audio-completion overlap needed for this fix

## 4. Source Documents
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
- `docs/execplan-ios-native-home-practice-navigation-defects-feature.md`
- `docs/execplan-ios-native-lock-screen-audio-mixing-feature.md`

## 5. Affected Files And Modules
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeOverviewSections.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeActiveSections.swift`
- `ios-native/MeditationNative/Features/Practice/CustomPlayLibraryView.swift`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- `ios-native/MeditationNative.xcodeproj/project.pbxproj`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift`
- `ios-native/MeditationNativeTests/ShellViewModelPresentationTests.swift`
- `ios-native/Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX Behavior
- Home and Practice `custom play` starts should stay available whenever no other practice is active, even if the saved recording is unavailable.
- When recording media is missing, the app should say so explicitly and run the saved duration plus start or end bells only, instead of pretending another recording exists.
- The Practice `custom play` library should keep `Start` visible on iPhone by letting secondary actions wrap cleanly.
- While a `custom play` recording is active and the phone locks, playback should be allowed to continue, and completion should still trigger the end bell or notification fallback truthfully.

## 7. Data And State Model
- No durable product model change is required for bells-only fallback; reuse `CustomPlay`, `ActiveCustomPlaySession`, and the existing `session log` contracts.
- Add runtime-only `custom play` completion notification reuse and playback-completion callbacks through the native audio controller seam.
- Improve remote-media recovery only when one clear media-catalog match exists; do not guess when multiple assets fit.

## 8. Risks
- Allowing start without recording media changes the earlier stricter interpretation of `custom play`; messaging must stay explicit so the user knows the session is running bells-only.
- Background-audio capability can affect app review expectations, so the repo docs and decisions need to document why it is enabled.
- Notification fallback reuse must not create duplicate end sounds when app-driven completion succeeds.

## 9. Milestones
1. Patch startability, fallback messaging, and iPhone action layout for Home and Practice `custom play` surfaces.
2. Improve backend media recovery for legacy or incomplete `custom play` records.
3. Add background-safe audio completion handling and reuse completion notification fallback for `custom play`.
4. Add focused tests, run native verification, and update durable docs.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-custom-play-defects CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-custom-play-defects-tests CODE_SIGNING_ALLOWED=NO build-for-testing`
- manual device follow-up when practical:
  - Home favorites start even when recording media is unavailable
  - Practice library always shows a visible `Start` action on iPhone width
  - locking the phone during a `custom play` still finishes with the end bell or fallback notification

## 11. Decision Log
- Keep missing-recording handling explicit, but allow a bells-only `custom play` run because a saved duration plus bells is more useful than a permanently disabled favorite.
- Reuse the existing completion-notification seam instead of adding a second notification pipeline just for `custom play`.
- Add background-audio capability so recording-backed `custom play` playback can remain truthful while locked.

## 12. Progress Log
- 2026-04-17: Re-read the required repo docs, prior native defect ExecPlans, and the newly supplied iPhone screenshots.
- 2026-04-17: Confirmed two distinct root causes:
  - `custom play` starts are still disabled whenever recording media cannot be resolved
  - `custom play` completion depends on foreground clock ticks, so lock-screen completion can miss the end bell
- 2026-04-17: Planned the fix slice around bells-only fallback starts, better legacy media recovery, responsive iPhone action layout, and background-safe completion handling.
