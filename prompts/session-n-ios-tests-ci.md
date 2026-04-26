# Session N — iOS: Tests, CI & Observability

## Context

Meditation app — Swift 6 / SwiftUI iOS native client in `ios-native/`.
Working branch: `review-fixes`. Sessions L and M address safety and architecture. This session addresses test coverage, CI, and observability gaps from `CODE-REVIEW-2026-04-24.md`.

Build and test with `swift test` (Core) and `xcodebuild test` (app target) from `ios-native/`.

**Issues addressed (5 total):**
- I-M9: No tests for session restoration under time warp (device clock jump while backgrounded)
- I-M11: Core package uses Swift 6 strict concurrency; app target concurrency level unverified
- I-M12: No iOS integration test for offline sync reconciliation
- I-L5: No telemetry / crash reporting — diagnostic exports only
- I-L7: `MeditationNativeUITests` may not run in CI

---

## I-M9: Session restoration under time warp

**Problem:** If a user backgrounds the app, changes the device clock, and foregrounds, the session restoration path receives an unexpected elapsed time. This is unverified — a clock jump could produce negative elapsed time, overflow, or a silently completed session.

**Context from Session A:** `ContinuousClock` (monotonic) was introduced for elapsed accounting. Session restoration from `AppSnapshot.activeRuntime` still uses wall-clock timestamps (`startedAt`, `lastResumedAt`). The time-warp test must exercise the restoration path, not the live-tick path.

**Files to read first:**
- After Session D and Session A, find where `AppSnapshot.activeRuntime` is loaded and a session is restored — likely in `ShellViewModel` or `TimerSessionCoordinator`
- `ios-native/MeditationNativeTests/ShellViewModelTests.swift` — understand existing test patterns and how the ViewModel is set up in tests
- Find the `ActivePracticeSnapshot` or equivalent type used in `AppSnapshot.activeRuntime`

**Changes:**

Add to `ios-native/MeditationNativeTests/ShellViewModelTests.swift` (or create a dedicated `SessionRestorationTests.swift`):

```swift
// MARK: - Time warp tests

func testRestorationWithClockJumpForward() throws {
    // Arrange: snapshot was saved 10 minutes ago, clock jumped forward by 1 hour
    let sessionStartedAt = Date().addingTimeInterval(-10 * 60)  // 10 min ago
    let clockJumpedTo = Date().addingTimeInterval(60 * 60)       // now + 1 hour simulated

    let snapshot = makeSnapshot(
        activeRuntime: makeActiveRuntime(
            startedAt: sessionStartedAt,
            lastResumedAt: sessionStartedAt,
            plannedDurationSeconds: 20 * 60  // 20-minute session
        )
    )

    // Act: restore the session using the jumped clock value
    let viewModel = makeViewModel(clock: { clockJumpedTo })
    viewModel.restoreFromSnapshot(snapshot)

    // Assert: elapsed time is clamped to planned duration (session should be completed)
    // or elapsed is at most plannedDurationSeconds — not negative, not overflowed
    let elapsed = viewModel.activeSession?.elapsedSeconds ?? 0
    XCTAssertGreaterThanOrEqual(elapsed, 0, "Elapsed must not be negative after clock jump")
    XCTAssertLessThanOrEqual(elapsed, 20 * 60, "Elapsed must not exceed planned duration")
}

func testRestorationWithClockJumpBackward() throws {
    // Arrange: clock moved backward (NTP correction, DST rollback)
    let sessionStartedAt = Date()
    let clockJumpedTo = Date().addingTimeInterval(-5 * 60)  // 5 minutes backward

    let snapshot = makeSnapshot(
        activeRuntime: makeActiveRuntime(
            startedAt: sessionStartedAt,
            lastResumedAt: sessionStartedAt,
            plannedDurationSeconds: 20 * 60
        )
    )

    let viewModel = makeViewModel(clock: { clockJumpedTo })
    viewModel.restoreFromSnapshot(snapshot)

    // Elapsed must be 0 or positive — not negative
    let elapsed = viewModel.activeSession?.elapsedSeconds ?? 0
    XCTAssertGreaterThanOrEqual(elapsed, 0, "Backward clock jump must not produce negative elapsed")
}

func testRestorationWithPausedSession() throws {
    // A paused session should restore with elapsedSeconds from the snapshot, not recomputed
    let snapshot = makeSnapshot(
        activeRuntime: makeActiveRuntime(
            startedAt: Date().addingTimeInterval(-20 * 60),
            lastResumedAt: nil,  // nil = paused
            elapsedSeconds: 5 * 60,
            plannedDurationSeconds: 20 * 60
        )
    )

    let viewModel = makeViewModel()
    viewModel.restoreFromSnapshot(snapshot)

    XCTAssertEqual(viewModel.activeSession?.elapsedSeconds, 5 * 60)
    XCTAssertEqual(viewModel.activeSession?.isPaused, true)
}
```

Add factory helpers `makeSnapshot(activeRuntime:)`, `makeActiveRuntime(...)`, and `makeViewModel(clock:)` that inject a clock closure so the "current time" is controllable in tests. If a `Clock` dependency is not yet injectable (check after Session A), add it:

```swift
// In ShellViewModel or TimerSessionCoordinator:
var currentDate: () -> Date = { Date() }  // injectable for testing
```

---

## I-M11: Enforce Swift 6 strict concurrency in app target

**Problem:** `ios-native/Package.swift` sets `swiftLanguageModes: [.v6]` for `MeditationNativeCore`. The app target (`MeditationNative.xcodeproj`) may be on a lower Swift language mode or have `-strict-concurrency=minimal`.

**Files to read first:**
- `ios-native/MeditationNative.xcodeproj/project.pbxproj` — search for `SWIFT_VERSION`, `OTHER_SWIFT_FLAGS`, and `SWIFT_STRICT_CONCURRENCY`
- `ios-native/Package.swift` — confirm Core package mode

**Changes:**

1. In Xcode project settings (edit `project.pbxproj` directly or open in Xcode), set for the app target:
   - `SWIFT_VERSION = 6.0`
   - `SWIFT_STRICT_CONCURRENCY = complete`

   Or add to `OTHER_SWIFT_FLAGS`:
   ```
   -strict-concurrency=complete
   ```

2. Build the app target and fix any concurrency errors that surface. Common patterns after enabling strict concurrency:
   - `@MainActor` annotation needed on types that access UI
   - `Sendable` conformance needed on types passed across actor boundaries
   - `nonisolated` needed on methods that don't access actor-isolated state

3. If fixing all errors in one session is impractical (strict concurrency can surface dozens of warnings), set `SWIFT_STRICT_CONCURRENCY = targeted` (the intermediate mode) and fix critical errors. Document remaining warnings in a comment.

4. Add a CI step (in `.github/workflows/`) that builds the app target with `-strict-concurrency=complete` and fails if errors appear:
   ```yaml
   - name: Build iOS app (strict concurrency)
     run: |
       xcodebuild build \
         -project ios-native/MeditationNative.xcodeproj \
         -scheme MeditationNative \
         -destination 'platform=iOS Simulator,name=iPhone 16' \
         OTHER_SWIFT_FLAGS="-strict-concurrency=complete" \
         | xcpretty
   ```

---

## I-M12: Offline sync reconciliation integration test

**Problem:** Core package tests exist for individual sync operations. There is no end-to-end test that: enqueues a mutation while offline, brings the backend up (mocked), and confirms reconciliation matches backend truth.

**Context:** The Core package is designed to be testable without a live backend. The sync reconciliation logic (`AppSyncFeature.reconcile`) accepts `remoteState` as a plain struct, so a test can provide a mock remote state.

**Files to read first:**
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift` — `AppSyncFeature.reconcile(remoteState:localSnapshot:pendingMutations:)`
- `ios-native/Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift` — existing test patterns
- `ios-native/Sources/MeditationNativeCore/Data/AppSnapshot.swift` — field names for constructing test data

**Changes:**

Add to `AppSyncServiceTests.swift`:

```swift
// MARK: - Offline sync reconciliation

func testOfflineMutationReconcileWithRemoteState() throws {
    // Arrange: local state with a custom play, plus a pending upsert mutation for it
    var localSnapshot = AppSnapshot.empty  // read AppSnapshot to find empty/default init
    let customPlayId = "cp-offline-test"
    localSnapshot.customPlays = [
        makeCustomPlay(id: customPlayId, name: "Offline Draft", updatedAt: pastDate(seconds: 300))
    ]

    let pendingMutation = SyncMutation(
        domain: .customPlay,
        operation: .upsert,
        recordId: customPlayId,
        payload: makeCustomPlayPayload(id: customPlayId, name: "Synced Name")
    )

    // Simulate: remote state has an older version of the same custom play
    let remoteState = makeRemoteState(customPlays: [
        makeRemoteCustomPlay(id: customPlayId, name: "Server Version", updatedAt: pastDate(seconds: 600))
    ])

    // Act: reconcile
    let result = AppSyncFeature.reconcile(
        remoteState: remoteState,
        localSnapshot: localSnapshot,
        pendingMutations: [pendingMutation]
    )

    // Assert: local mutation wins (it's newer than remote)
    let reconciled = result.snapshot.customPlays.first(where: { $0.id == customPlayId })
    XCTAssertNotNil(reconciled)
    XCTAssertEqual(reconciled?.name, "Synced Name",
        "Pending upsert should win over older remote state")

    // Assert: pending mutation is preserved in result (still needs to be sent)
    XCTAssertTrue(result.pendingMutations.contains(where: { $0.recordId == customPlayId }),
        "Pending mutation should remain until server confirms")
}

func testOfflineDeleteReconcileWithRemoteState() throws {
    // Arrange: local state with a custom play that was deleted offline
    var localSnapshot = AppSnapshot.empty
    let customPlayId = "cp-delete-test"
    // Play is NOT in local snapshot (already deleted locally)

    let pendingMutation = SyncMutation(
        domain: .customPlay,
        operation: .delete,
        recordId: customPlayId,
        payload: nil
    )

    // Remote still has the play (hasn't received the delete yet)
    let remoteState = makeRemoteState(customPlays: [
        makeRemoteCustomPlay(id: customPlayId, name: "Will Be Deleted")
    ])

    let result = AppSyncFeature.reconcile(
        remoteState: remoteState,
        localSnapshot: localSnapshot,
        pendingMutations: [pendingMutation]
    )

    // Local delete wins: play should not appear in reconciled snapshot
    let found = result.snapshot.customPlays.first(where: { $0.id == customPlayId })
    XCTAssertNil(found, "Deleted record should not re-appear after reconcile with remote")
}
```

Add factory helpers `makeCustomPlay`, `makeCustomPlayPayload`, `makeRemoteState`, `makeRemoteCustomPlay`, `pastDate(seconds:)`. Read `AppSyncService.swift` for exact type names.

---

## I-L5: OSLog diagnostic export (basic telemetry)

**Problem:** For a single-user app on a personal device, full crash reporting (Sentry, Firebase) may be overkill. However, there is currently no way to export diagnostic information without connecting Xcode.

**Changes:**

Add an OSLog-based diagnostic export that can be triggered from Settings:

1. Create `ios-native/MeditationNative/Features/Settings/DiagnosticsExport.swift`:
   ```swift
   import OSLog

   @MainActor
   enum DiagnosticsExport {
       /// Collects recent OSLog entries from this app's subsystem and returns them as a string.
       static func collectLogs(since: Date = Date().addingTimeInterval(-3600)) async throws -> String {
           let store = try OSLogStore(scope: .currentProcessIdentifier)
           let position = store.position(date: since)
           let entries = try store.getEntries(at: position)
               .compactMap { $0 as? OSLogEntryLog }
               .filter { $0.subsystem == "com.meditation.native" }
               .map { "[\($0.date)] [\($0.category)] \($0.composedMessage)" }
           return entries.joined(separator: "\n")
       }
   }
   ```

2. In `SettingsView.swift`, add a "Share Diagnostics" button:
   ```swift
   Button("Share Diagnostics") {
       Task {
           let logs = try? await DiagnosticsExport.collectLogs()
           // Present share sheet with logs text
           shareDiagnostics(logs ?? "No logs available")
       }
   }
   ```

3. Implement `shareDiagnostics` using `UIActivityViewController` wrapped in a SwiftUI sheet.

4. Note: `OSLogStore(scope: .currentProcessIdentifier)` is available on iOS 15+. Add an availability check.

---

## I-L7: Verify MeditationNativeUITests in CI

**Problem:** `MeditationNativeUITests` exists but may not run in CI, making it dev-only and useless for regression detection.

**Files to read first:**
- `.github/workflows/` — find the CI workflow(s)
- `ios-native/MeditationNativeUITests/MeditationNativeUITests.swift` — understand what the tests cover

**Changes:**

1. Read the existing CI workflow to understand what iOS steps exist (if any).

2. Add a CI job that runs UI tests on a simulator:
   ```yaml
   ios-ui-tests:
     runs-on: macos-15
     steps:
       - uses: actions/checkout@v4
       - name: Run iOS UI Tests
         run: |
           xcodebuild test \
             -project ios-native/MeditationNative.xcodeproj \
             -scheme MeditationNativeUITests \
             -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.0' \
             | xcpretty
   ```

3. If the UI tests are currently broken or flaky, fix the most critical one (app launch) and mark others as `XCTSkip` with a tracking comment:
   ```swift
   func testPlaylistCreation() throws {
       throw XCTSkip("Tracked in issue #XX — flaky on CI due to animation timing")
   }
   ```

4. Add a minimum bar: the app must launch without crashing. Confirm the `testLaunch()` test (or equivalent) is in the UI test target and passes.

---

## Verification

1. Run `swift test` from `ios-native/` — all Core package tests pass, including new reconciliation tests.
2. Run `xcodebuild test -scheme MeditationNative` — all app tests pass, including new time-warp tests.
3. Run `xcodebuild test -scheme MeditationNativeUITests` — at minimum the app launch test passes.
4. Open Console.app, filter by `com.meditation.native` — confirm the diagnostic export produces readable log lines.
5. After enabling strict concurrency (`-strict-concurrency=complete`), build succeeds (or remaining issues are documented).

## After finishing

Commit on branch `review-fixes`:
```
test(ios): session restoration time-warp tests, offline sync reconciliation test, CI, and diagnostics (I-M9, I-M11, I-M12, I-L5, I-L7)
```
