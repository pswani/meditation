# Native iOS Sync Parity ExecPlan

## 1. Objective
Introduce backend-backed, local-first sync behavior for the native iOS app so timer settings, `session log` history, `custom play`, playlist, `sankalpa`, and summary data can hydrate from the existing backend while preserving calm on-device fallback and deferred write safety.

## 2. Why
The native app currently behaves as a local-only prototype even though the web app already supports backend-backed persistence, queue-backed offline writes, and compact connectivity messaging. This slice closes the trust gap so the native app can move toward parity without abandoning local-first behavior on device.

## 3. Scope
Included:
- explicit native REST boundary aligned with current backend routes
- local queue persistence for deferred native writes
- native hydration from backend-backed timer settings, `session log`, `custom play`, playlist, `sankalpa`, and summary reads
- reconciliation that overlays pending local edits onto backend fetches so local changes do not disappear
- calm sync-status and connectivity messaging in the shell and Settings
- focused tests for request mapping, queue reduction, reconciliation, and fallback behavior
- durable doc updates for native sync setup and current repo state

Excluded:
- backend API redesign
- real media-file download or playback sync beyond the existing native placeholder-audio seam
- unrelated native screen decomposition outside what sync integration strictly requires
- full real-device simulator orchestration beyond the repo's existing verification workflow

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/ios-native/README.md`
- `prompts/ios-native-parity-gap-phased-plan.md`
- `prompts/run-milestone-bundle.md`
- `prompts/ios-native-sync-parity-feature-bundle-with-branching/*`

## 5. Affected files and modules
- `ios-native/Sources/MeditationNativeCore/Data/`
- `ios-native/Sources/MeditationNativeCore/Domain/`
- `ios-native/Sources/MeditationNativeCore/Services/`
- `ios-native/MeditationNative/App/`
- `ios-native/MeditationNative/Features/Settings/`
- `ios-native/MeditationNativeTests/`
- `ios-native/Tests/MeditationNativeCoreTests/`
- `docs/ios-native/README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-sync-parity-feature.md`
- `docs/test-ios-native-sync-parity-feature.md`

## 6. UX behavior
- The app remains usable when no backend base URL is configured.
- When a backend base URL is configured, native startup attempts a calm backend refresh without blocking the UI.
- Local edits stay visible immediately and queue for later replay when the backend is unreachable.
- The shell and Settings distinguish:
  - local-only profile
  - offline
  - backend unavailable
  - syncing
  - pending sync
  - last sync success
- Copy stays compact, non-blocking, and explicit when the app is showing local state while sync is pending or unavailable.
- Representative create, update, and delete flows preserve device-only fields that the backend does not currently store, such as placeholder native media bindings.

## 7. Data and state model
- Keep `AppSnapshot` as the local source of truth for the current device state.
- Add a persisted native sync store for:
  - deferred mutation queue
  - last sync metadata
  - connectivity classification
  - optional last successful backend summary snapshot
- Queue entries are domain-specific and carry enough payload for idempotent replay or delete handling.
- Hydration reads backend state by domain, then overlays queued or unsynced local mutations before publishing the merged snapshot.
- Delete reconciliation handles stale-delete responses by restoring the backend-backed record with explicit messaging.

## 8. Risks
- Backend and native models are close but not identical, especially for `custom play` media and `sankalpa` progress payloads.
- Queue replay must avoid silently dropping edits when one domain succeeds and another fails.
- Summary can come from the backend, but local derivation must stay trustworthy when the backend is unavailable.
- This environment may still lack a concrete iOS Simulator destination for full `xcodebuild test`.

## 9. Milestones
1. Define native sync data structures, queue persistence, and REST DTO mapping.
2. Add a native sync coordinator that hydrates backend state and replays queued writes.
3. Integrate sync status into `ShellViewModel` and expose calm shell or Settings messaging.
4. Add focused tests for queue reduction, reconciliation, and fallback behavior.
5. Run review, verification, and doc updates.

## 10. Verification
- `SWIFTPM_MODULECACHE_OVERRIDE=/tmp/meditation-swift-module-cache CLANG_MODULE_CACHE_PATH=/tmp/meditation-swift-clang-cache swift test --package-path ios-native`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-sync-parity CODE_SIGNING_ALLOWED=NO build`
- `xcodebuild -project ios-native/MeditationNative.xcodeproj -scheme MeditationNative -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/meditation-ios-sync-parity CODE_SIGNING_ALLOWED=NO test` or document the concrete simulator limitation if it still applies
- relevant local backend verification for `/api/health` and native-facing REST routes when sync wiring is in place

## 11. Decision log
- Use the existing REST routes instead of inventing a native-only sync endpoint.
- Keep local snapshot persistence as the first write target, with queued backend replay as a follow-up side effect.
- Preserve native-only placeholder media bindings on this device even when the backend payload does not carry those fields.

## 12. Progress log
- 2026-04-10: Read required repo docs, bundle prompts, and backend contract files.
- 2026-04-10: Confirmed `codex/ios` as the parent branch and created `codex/ios-native-sync-parity-feature-bundle-with-branching`.
- 2026-04-10: Confirmed the native app is currently local-only with no API or queue layer.
- 2026-04-10: Added native sync-state models, REST mapping, queued replay, backend hydration, and shell or Settings sync messaging.
- 2026-04-10: Added focused sync tests for backend mapping, queue reduction, reconciliation, queued-header replay, and stale-delete notices.
- 2026-04-10: Verified `swift test`, `xcodebuild build`, `xcodebuild build-for-testing`, and local backend route reachability; documented the concrete-simulator limitation blocking `xcodebuild test`.
