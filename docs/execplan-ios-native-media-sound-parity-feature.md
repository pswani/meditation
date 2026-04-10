# ExecPlan: iOS Native Media And Sound Parity

## 1. Objective
Align the native iOS app's timer sound contract and `custom play` / playlist-linked media behavior with the implemented web app, replacing misleading placeholder playback with honest, web-aligned media handling.

## 2. Why
- The current iOS app still exposes timer sound choices that the web app retired.
- Native timer cues do not use the same bundled audio assets as the web app.
- Native `custom play` and linked playlist playback currently pretends to be real media parity by using placeholder loops.
- These gaps weaken trust because the same saved practice can behave differently between web and iPhone.

## 3. Scope
Included:
- native timer sound reference data, normalization, and playback asset mapping
- migration or normalization of legacy stored sound labels
- native `custom play` media modeling needed for real playback URLs or bundled sample media
- native playlist validation and runtime behavior for linked recording items
- focused native test coverage for sound normalization, media mapping, and runtime transitions
- durable iOS and repo docs required by these changes

Excluded:
- active-session recovery
- unrelated navigation or layout redesign
- backend feature expansion beyond existing media metadata contracts
- broader deployment automation work

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
- `prompts/ios-native-media-sound-parity-feature-bundle-with-branching/00-create-branch.md`
- `prompts/ios-native-media-sound-parity-feature-bundle-with-branching/01-implement-ios-native-media-sound-parity.md`

## 5. Affected files and modules
- `ios-native/Sources/MeditationNativeCore/Domain/ReferenceData.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/Models.swift`
- `ios-native/Sources/MeditationNativeCore/Domain/TimerFeature.swift`
- `ios-native/Sources/MeditationNativeCore/Data/SampleData.swift`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- `ios-native/MeditationNative/App/SystemSupport.swift`
- `ios-native/MeditationNative/App/ShellSnapshotSupport.swift`
- `ios-native/MeditationNative/App/ShellViewModel.swift`
- `ios-native/MeditationNative/Components/TimerDraftForm.swift`
- `ios-native/MeditationNative/Features/Practice/CustomPlayLibraryView.swift`
- `ios-native/MeditationNative/Features/Practice/PlaylistLibraryView.swift`
- `ios-native/MeditationNative/Features/Practice/PracticeActiveSections.swift`
- `ios-native/Tests/MeditationNativeCoreTests/*`
- `ios-native/MeditationNativeTests/*`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Timer sound pickers should offer only the current web-aligned sounds: `Temple Bell` and `Gong`, plus `None`.
- Legacy stored values such as `Soft Chime` and `Wood Block` should normalize quietly to the current labels instead of reappearing as active choices.
- Timer start, end, and interval cues should use the same bundled sound files already used by the web app rather than unrelated system IDs.
- `custom play` and playlist-linked media copy should describe actual media availability and source, not placeholder playback.
- A linked recording should run only when the app has a truthful playback target:
  - bundled sample media that really exists in the app bundle
  - or backend-linked media with a resolvable remote URL
- When real media is unavailable, the UI should explain that directly instead of swapping in a fake loop.

## 7. Data and state model
- Add a native timer sound catalog helper that owns:
  - selectable labels
  - legacy-label normalization
  - bundled sound filename mapping
- Normalize stored timer sound labels during snapshot and backend hydration.
- Evolve native `CustomPlayMedia` from placeholder loop selection into an explicit playback descriptor that can represent:
  - bundled sample media shipped with the app
  - backend-linked remote media metadata from `/api/media/custom-plays`
- Preserve `linkedMediaIdentifier` as the sync seam and reconcile local-only fields without recreating fake media.
- Keep local-only sample data runnable only where the app has a real bundled media file; leave other entries unavailable rather than fabricated.

## 8. Risks
- The repo only contains one real sample `custom play` recording file today, so local-only parity will remain bounded unless backend media is configured.
- Snapshot compatibility must avoid crashing on older stored placeholder-media shapes.
- AVFoundation playback changes can introduce regressions if pause, resume, or playlist phase transitions are not handled carefully.
- App-target tests and Swift package tests both need to stay green after any model shape changes.

## 9. Milestones
1. Create the shared native timer sound contract and stored-value normalization.
2. Replace system-sound playback with bundled web-aligned sound asset playback.
3. Refactor native custom-play media descriptors to represent truthful bundled or remote playback targets.
4. Update `custom play`, playlist, and runtime UI copy plus validation around real media availability.
5. Update focused tests and durable docs.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-media-sound-parity CODE_SIGNING_ALLOWED=NO build`
- Run repo-wide frontend checks only if shared web-facing assets or contracts change:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Manual follow-up if possible:
  - verify timer cues on an iPhone
  - verify remote custom-play playback against a configured backend

## 11. Decision log
- 2026-04-10: Use the web timer sound catalog as the native source of truth for selectable labels and legacy normalization.
- 2026-04-10: Do not keep `Wood Block` as a first-class current native timer option.
- 2026-04-10: Do not fabricate local `custom play` parity with placeholder loops when real media metadata or files are absent.

## 12. Progress log
- 2026-04-10: Reviewed required repo docs, native iOS README, parity review, current branch state, and the full bundle prompt sequence.
- 2026-04-10: Confirmed parent branch `codex/ios` is safe and created feature branch `codex/ios-native-media-sound-parity-feature-bundle-with-branching`.
- 2026-04-10: Replaced the native timer sound contract with the web-aligned `Temple Bell` / `Gong` catalog, plus legacy-label normalization during hydration and sync mapping.
- 2026-04-10: Reworked native `CustomPlayMedia` into a truthful bundled-sample or backend-linked playback descriptor, added bundled sample recording packaging, and removed placeholder-loop runtime behavior.
- 2026-04-10: Updated Practice and Home copy so unavailable recordings stay explicit instead of pretending to play local placeholder audio.
- 2026-04-10: Review found one in-scope trust gap: some playlist and custom-play affordances still treated backend-linked media as runnable in local-only mode if the record was nominally present.
- 2026-04-10: Fixed that gap by routing UI enablement and playlist launch validation through environment-aware playback-resolution checks in `ShellViewModel`.
- 2026-04-10: Verification passed with:
  - `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
  - `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-media-sound-parity CODE_SIGNING_ALLOWED=NO build`
- 2026-04-10: Remaining follow-up is manual iPhone validation for timer cues, bundled sample recording playback, and backend-linked recording playback.
