# Session M — iOS: Architecture, State Reliability & Sync Resilience

## Context

Meditation app — Swift 6 / SwiftUI iOS native client in `ios-native/`.
Working branch: `review-fixes`. Session L addresses safety fixes. This session addresses architectural improvements and state reliability findings from `CODE-REVIEW-2026-04-24.md`.

Build with `swift test` (Core package) and `xcodebuild test` (app target) from `ios-native/`.
Read the full `ShellViewModel.swift` and all Session D outputs before writing any code — Session D may have already moved significant logic.

**Issues addressed (7 total):**
- I-M1: `@ObservedObject` vs `@StateObject` ownership unclear in child views
- I-M2: `@Published activeSession` reassigned every tick — causes every-second full re-renders
- I-M5: `JSONFileStore` atomic per file but not transactional across multiple files
- I-M6: No snapshot schema versioning — adding fields will fail old snapshots silently
- I-M7: Pending mutations queue is unbounded — offline for months = unbounded memory
- I-L4: `AppSyncState` corruption → permanent "pending sync" banner with no recovery
- I-L6: Access control not audited on MeditationNativeCore public surface

---

## I-M1: Document @ObservedObject vs @StateObject ownership

**Problem:** The root view uses `@StateObject` (owns the ViewModel); child views use `@ObservedObject` on the same instance. This is correct by convention but undocumented, so a future contributor might introduce a second `@StateObject` that creates a new unshared instance.

**Files to read first:**
- `ios-native/MeditationNative/App/MeditationNativeApp.swift` — find where `ShellViewModel` is created
- `ios-native/MeditationNative/App/ShellRootView.swift` — find how the ViewModel is passed to child views
- Any child views that access the ViewModel

**Changes:**

1. Add a comment at the `@StateObject` declaration site:
   ```swift
   // @StateObject: owns the ViewModel lifecycle. Pass to children as @ObservedObject
   // or @EnvironmentObject — never let a child hold @StateObject of the same instance.
   @StateObject private var viewModel = ShellViewModel()
   ```

2. At the `@ObservedObject` sites in child views, add:
   ```swift
   // @ObservedObject: does NOT own lifecycle. Instance is owned by the parent's @StateObject.
   @ObservedObject var viewModel: ShellViewModel
   ```

3. If the ViewModel is passed through more than 2 levels of the view hierarchy, consider migrating to `@EnvironmentObject` for deep descendants — inject it at the root:
   ```swift
   ShellRootView()
     .environmentObject(viewModel)
   ```
   And in deep descendants:
   ```swift
   @EnvironmentObject var viewModel: ShellViewModel
   ```
   Only do this migration if the passing depth is clearly excessive (> 3 levels). Otherwise, the comment-only approach is sufficient.

---

## I-M2: Extract ActiveSessionDisplay to reduce per-second re-renders

**Problem:** `ShellViewModel.activeSession` (or equivalent after Session D) is a `@Published` property reassigned every tick. Any SwiftUI view that observes anything from the ViewModel re-renders every second, even if only the formatted time changed.

**Files to read first:**
- `ios-native/MeditationNative/App/ShellViewModel.swift` (post-Session D) — find `activeSession` and `@Published` properties that change on every tick
- `ios-native/MeditationNative/App/ShellViewModelPresentation.swift` — find `formattedTime`, `progressFraction`, and similar derived display properties
- The SwiftUI views that show the timer — find which views observe the ViewModel directly

**Changes:**

Create `ios-native/MeditationNative/App/ActiveSessionDisplay.swift`:

```swift
import Observation
import SwiftUI

/// Publishes only the display-layer properties of an active session.
/// Separating this from ShellViewModel prevents all ViewModel observers
/// from re-rendering on every timer tick.
@Observable
final class ActiveSessionDisplay {
    var formattedElapsedTime: String = "00:00"
    var progressFraction: Double = 0.0
    var isActive: Bool = false
    var isPaused: Bool = false
    var sessionTitle: String = ""
}
```

In `ShellViewModel` (or `TimerSessionCoordinator` from Session D):
1. Add `let sessionDisplay = ActiveSessionDisplay()`.
2. On every tick, update `sessionDisplay` properties instead of reassigning `activeSession`:
   ```swift
   @MainActor func tickSession() {
       guard let session = activeSession else { return }
       // Update display object — only the ActiveSessionDisplay observers re-render
       sessionDisplay.formattedElapsedTime = formatDuration(session.elapsedSeconds)
       sessionDisplay.progressFraction = session.progressFraction
       // ... other display updates
   }
   ```
3. Pass `sessionDisplay` to the timer views instead of passing the full ViewModel. Timer views observe only `sessionDisplay`.

This change requires reading the existing timer view hierarchy carefully to understand what data each view needs. Do not rush this — if Session D significantly changed the architecture, adapt the approach accordingly.

---

## I-M5: Coordinate JSONFileStore writes across snapshot and sync-state files

**Problem:** `LocalAppSnapshotRepository` writes `AppSnapshot` and `AppSyncState` as two separate files via two `JSONFileStore` instances. Each write is individually atomic (Foundation's `.atomic` option), but a crash between the two leaves them inconsistent.

**Files to read first:**
- `ios-native/Sources/MeditationNativeCore/Services/JSONFileStore.swift`
- Find `LocalAppSnapshotRepository` — likely in `Sources/MeditationNativeCore/`
- Understand which two files are written and in what order

**Changes:**

**Approach: combine into a single atomic write.** Rather than writing two separate files, wrap both values in a container and write once:

1. Create `CombinedAppState` in the Core package:
   ```swift
   public struct CombinedAppState: Codable, Equatable, Sendable {
       public var snapshot: AppSnapshot
       public var syncState: AppSyncState
       public var version: Int = 1
   }
   ```

2. Create a `CombinedAppStateStore` that wraps a single `JSONFileStore<CombinedAppState>`:
   ```swift
   public final class CombinedAppStateStore {
       private let store: JSONFileStore<CombinedAppState>

       public func save(snapshot: AppSnapshot, syncState: AppSyncState) throws {
           try store.save(CombinedAppState(snapshot: snapshot, syncState: syncState))
       }

       public func load() throws -> CombinedAppState? {
           try store.load()
       }
   }
   ```

3. Migrate `LocalAppSnapshotRepository` to use `CombinedAppStateStore`.

4. On first load, if the combined file doesn't exist but the individual files do, read each independently and migrate:
   ```swift
   if combinedFile.exists == false {
       let legacy = loadLegacyFiles()
       try store.save(CombinedAppState(snapshot: legacy.snapshot, syncState: legacy.syncState))
   }
   ```

5. Update all tests that use `LocalAppSnapshotRepository`.

Note: If this migration is too risky to complete in one session (it touches all storage paths), implement the migration as a two-phase approach:
- Phase 1 (this session): add `CombinedAppState` and `CombinedAppStateStore`; write to the combined file IN ADDITION to the individual files (belt-and-suspenders).
- Phase 2 (future): remove the individual file writes once the combined store is proven.

---

## I-M6: Snapshot schema versioning

**Problem:** `AppSnapshot` and `AppSyncState` have no `version: Int` field. Adding a non-optional field will fail decoding of old snapshots. Users upgrading the app lose their local data silently.

**Files to read first:**
- `ios-native/Sources/MeditationNativeCore/Data/AppSnapshot.swift`
- Find `AppSyncState` definition
- `ios-native/Sources/MeditationNativeCore/Services/JSONFileStore.swift` — understand how `Decodable` is used

**Changes:**

1. Add `version: Int` to `AppSnapshot` and `AppSyncState`:
   ```swift
   public struct AppSnapshot: Codable, Equatable, Sendable {
       public static let currentVersion = 2  // increment on each breaking schema change
       public var version: Int = AppSnapshot.currentVersion
       // ... existing fields
   }
   ```

2. Make decoding version-aware by implementing `init(from decoder: Decoder)`:
   ```swift
   public init(from decoder: Decoder) throws {
       let container = try decoder.container(keyedBy: CodingKeys.self)
       let version = try container.decodeIfPresent(Int.self, forKey: .version) ?? 1
       // Decode common fields
       self.timerDraft = try container.decode(TimerSettingsDraft.self, forKey: .timerDraft)
       // ... decode remaining fields
       // Apply migrations based on version
       self = Self.migrate(from: self, version: version)
       self.version = Self.currentVersion
   }

   private static func migrate(from snapshot: AppSnapshot, version: Int) -> AppSnapshot {
       var result = snapshot
       if version < 2 {
           // Example: v1 → v2 added `summary` field with a default
           // result.summary = SummarySnapshot.empty
       }
       return result
   }
   ```

3. Add a test that decodes a v1 fixture (a hardcoded JSON string without the `version` field) and confirms it produces a valid `AppSnapshot` with the current version:
   ```swift
   func testDecodesLegacyV1Snapshot() throws {
       let json = """
       { "timerDraft": { ... }, "recentSessionLogs": [] }
       """
       let data = json.data(using: .utf8)!
       let snapshot = try JSONDecoder().decode(AppSnapshot.self, from: data)
       XCTAssertEqual(snapshot.version, AppSnapshot.currentVersion)
   }
   ```

---

## I-M7: Cap pending mutations queue

**Problem:** `AppSyncService.enqueue()` appends mutations without any size limit. A user who goes offline for weeks accumulates an unbounded in-memory and on-disk mutations array.

**Files to read first:**
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift` — find `enqueue` (line ~55)
- `ios-native/Sources/MeditationNativeCore/Data/AppSyncState.swift` — find the `pendingMutations` array

**Changes:**

1. Define a cap constant:
   ```swift
   public static let maxPendingMutations = 500
   ```

2. In `AppSyncService.enqueue`, enforce the cap:
   ```swift
   public static func enqueue(_ mutation: SyncMutation, into state: AppSyncState) -> AppSyncState {
       var next = state
       next.pendingMutations.append(mutation)
       if next.pendingMutations.count > maxPendingMutations {
           // Drop oldest mutations first (they'll be reconciled on next server sync anyway)
           let overflow = next.pendingMutations.count - maxPendingMutations
           next.pendingMutations.removeFirst(overflow)
           next.mutationQueueOverflowed = true  // Add this flag to AppSyncState
       }
       return next
   }
   ```

3. Add `mutationQueueOverflowed: Bool = false` to `AppSyncState`.

4. In the UI (find the sync status indicator in `ShellRootView` or similar), when `mutationQueueOverflowed` is true, show: *"Some offline changes were discarded due to extended offline period. Sync now to restore from server."*

5. Clear `mutationQueueOverflowed` after a successful sync pass.

---

## I-L4: Graceful AppSyncState corruption recovery

**Problem:** If `AppSyncState` JSON is corrupted (truncated file, encoding error), `JSONFileStore.load()` will throw. The current handling may swallow the error, leaving the sync indicator stuck in "pending" forever with no way for the user to recover.

**Files to read first:**
- Find where `AppSyncState` is loaded — likely in `LocalAppSnapshotRepository` or `ShellSnapshotSupport.swift`
- `ios-native/MeditationNative/App/ShellSnapshotSupport.swift` — find the load path
- Find how the sync status indicator is driven

**Changes:**

In the sync state load path:
```swift
func loadSyncState() -> AppSyncState {
    do {
        if let state = try syncStateStore.load() {
            return state
        }
        return AppSyncState()
    } catch {
        // Corruption detected — log, reset to empty state, and mark for re-sync
        audioLogger.error("AppSyncState corrupted, resetting: \(error.localizedDescription, privacy: .public)")
        // Delete the corrupted file so next load gets a fresh state
        try? FileManager.default.removeItem(at: syncStateFileURL)
        var fresh = AppSyncState()
        fresh.needsFullResync = true  // trigger a pull-from-server on next sync
        return fresh
    }
}
```

Add `needsFullResync: Bool = false` to `AppSyncState`. In the sync pass runner, detect this flag and perform a full reconcile pull before sending local mutations.

Surface a one-time informational banner: *"Local sync state was reset. Your data will re-sync from the server."*

---

## I-L6: Audit MeditationNativeCore public surface

**Problem:** The Core package may have `public` declarations that are only used internally. Swift's default access level is `internal`, which is safer. Unnecessary `public` declarations increase the committed API surface.

**Files to read first:**
- All files under `ios-native/Sources/MeditationNativeCore/` — list all `public` declarations

**Changes:**

1. Run this command from `ios-native/`:
   ```bash
   grep -rn "^    public\|^public" Sources/MeditationNativeCore/ | grep -v "// public" | sort
   ```

2. For each `public` declaration, verify it is accessed from `ios-native/MeditationNative/` (the app target) or from `ios-native/Tests/`. If it is only used within `Sources/MeditationNativeCore/`, change it to `internal`.

3. Common cases to downgrade:
   - Helper methods inside `public` types that are only called within the package
   - `public init` variants that the app never calls directly
   - `public static` utility functions that wrap internal logic

4. Build both the Core package and the app target after each change to confirm nothing breaks.

5. Do not remove `public` from any type, method, or property that is directly referenced in the app target or in test files.

---

## Verification

1. Run `swift test` from `ios-native/` — all Core package tests must pass.
2. Run `xcodebuild test` — all app tests must pass.
3. The legacy v1 snapshot decode test must pass.
4. Simulate offline: disconnect network, perform 501 mutations, confirm the 501st is dropped and `mutationQueueOverflowed` is true, confirm the UI banner appears.
5. Corrupt `AppSyncState.json` on disk (truncate it), restart the app — confirm it recovers gracefully with a banner rather than hanging.

## After finishing

Commit on branch `review-fixes`:
```
fix(ios): architecture improvements and state reliability (I-M1, I-M2, I-M5, I-M6, I-M7, I-L4, I-L6)
```
