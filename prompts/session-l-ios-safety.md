# Session L — iOS: Safety, Logging & Audio Correctness

## Context

Meditation app — Swift 6 / SwiftUI iOS native client in `ios-native/`.
Working branch: `review-fixes`. Sessions A, C, D address top-10 cross-cutting iOS issues. This session addresses remaining safety and correctness findings from `CODE-REVIEW-2026-04-24.md`.

Build and test with `xcodebuild test -scheme MeditationNative -destination 'platform=iOS Simulator,name=iPhone 16'` from `ios-native/`, or run from Xcode. Core package tests: `swift test` from `ios-native/`.

**Issues addressed (9 total):**
- I-H2: `Task { ... }` captures without `[weak self]` in `ShellViewModel.swift` — verify and fix any remaining
- I-H7: Force-unwraps (`try!`) in test helpers mask real flakes
- I-M3: `AVAudioFormat` and `AVAudioPCMBuffer` force-unwrapped in `SilentBackgroundAudioKeepAlive`
- I-M4: JSON date encoding/decoding not configured centrally — `Date.iso8601(...)` calls scattered
- I-M8: Audio errors caught silently (no `os.Logger` output)
- I-M10: `pausePlayback()` does not release the audio session lease — keeps session active during long pauses
- I-L1: `deinit` relies on no retain cycles — verify closures use `[weak self]`
- I-L2: `SilentBackgroundAudioKeepAlive.end()` doesn't await engine teardown before deactivating session
- I-L3: Missing bundled sound file → silent failure in both DEBUG and RELEASE

**Already confirmed fixed — do NOT re-implement:**
- I-H1: `DispatchSourceTimer` + `ContinuousClock` — done in Session A
- I-H3: Background audio keepalive conditions — done in Session C
- I-H4: `AVAudioSession.interruptionNotification` handling — already implemented in `BundledCustomPlayAudioPlayer`
- I-H5: `ShellViewModel` god object refactoring — done in Session D
- I-H6: `.duckOthers` + `.notifyOthersOnDeactivation` — already in `PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()` at line 627

---

## I-H2: Audit Task captures for [weak self]

**Problem:** The code review identified Task closures at ShellViewModel.swift lines ~369, 599, 909, 1249, 1265–1267, 1555, 1573 that may capture `self` strongly. Subsequent refactoring in Session D may have moved or eliminated some of these.

**Files to read first:**
- `ios-native/MeditationNative/App/ShellViewModel.swift` — after Session D's refactoring, grep for every `Task {` and `Task { @MainActor`
- Any new coordinator files created in Session D: `TimerSessionCoordinator.swift`, `CustomPlaySessionCoordinator.swift`, `PlaylistSessionCoordinator.swift`

**Changes:**

1. In each file, search for `Task {` and `Task { @MainActor`. For each one:
   - If the closure accesses `self` (directly or via a captured property) and the Task is unstructured (not created with `async let` or `TaskGroup`), verify `[weak self]` is in the capture list.
   - If `[weak self]` is absent, add it: `Task { [weak self] in guard let self else { return } ... }`

2. Run the build — Swift 6's strict concurrency checks will surface retain issues as warnings or errors. Fix any Sendability warnings in the same pass if they are directly caused by the capture changes.

3. For any Task that is truly one-shot (created in `init` or in a method that runs once), confirm it is stored in a `Task<Void, Never>?` property and cancelled in `deinit`.

---

## I-H7: Replace try! in test helpers

**Problem:** `ios-native/Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift` line 980 uses `try! JSONSerialization.data(...)`. When JSON serialization unexpectedly fails (e.g., due to a non-serializable object), the test crashes with a fatal error rather than a readable test failure, making the flake described in `EXECPLAN-ios-native-bell-reliability.md` harder to diagnose.

**Files to read first:**
- `ios-native/Tests/MeditationNativeCoreTests/AppSyncServiceTests.swift` — line 980 and surrounding context; find all `try!` and `!` force-unwraps in the test file
- Other test files in `ios-native/Tests/` — check for similar patterns

**Changes:**

Replace `try!` with `XCTUnwrap` or `try` with a `throws` declaration on the test function:

```swift
// Before:
let data = try! JSONSerialization.data(withJSONObject: object, options: [])

// After (make the helper function throws):
let data = try JSONSerialization.data(withJSONObject: object, options: [])
// The test function must be declared `throws` or `async throws`
```

For force-unwrapped optionals (`foo!`) in test setup:
```swift
// Before:
let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)!

// After:
let response = try XCTUnwrap(HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil))
```

Apply this pattern to ALL `try!` and significant `!` unwraps in test helpers. Test fixture helpers should declare `throws` so failures produce readable messages.

---

## I-M3: Fix AVAudioFormat and AVAudioPCMBuffer force-unwraps

**Problem:** `ios-native/MeditationNative/App/SystemSupport.swift` lines 521 and 523 force-unwrap `AVAudioFormat(standardFormatWithSampleRate:channels:)` and `AVAudioPCMBuffer(pcmFormat:frameCapacity:)`. Standard parameters (44.1 kHz, 1 channel, 4096 frames) should always succeed in practice, but a defensive guard prevents a crash on unusual hardware configurations.

**Files to read first:**
- `ios-native/MeditationNative/App/SystemSupport.swift` — lines 516–530 (the `SilentBackgroundAudioKeepAlive` initializer)

**Changes:**

Replace the force-unwraps with guarded initialization:

```swift
// Before:
let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCapacity)!

// After:
guard let format = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1) else {
    os_log("SilentBackgroundAudioKeepAlive: failed to create audio format", log: .default, type: .fault)
    // The keepalive cannot function without the format — set a flag and exit gracefully
    self.isUnavailable = true
    return
}
guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCapacity) else {
    os_log("SilentBackgroundAudioKeepAlive: failed to create silent buffer", log: .default, type: .fault)
    self.isUnavailable = true
    return
}
```

Add `private var isUnavailable = false` to `SilentBackgroundAudioKeepAlive`. In `begin()`, add an early return if `isUnavailable`:
```swift
func begin() {
    guard !isUnavailable else { return }
    // ... rest of begin
}
```

The `os_log` calls will surface as `.fault`-level entries in Console.app, highly visible during debugging.

---

## I-M4: Centralize JSON date encoding strategy

**Problem:** `AppSyncService.swift` calls `Date.iso8601(...)` (a custom extension) at multiple call sites rather than configuring `JSONEncoder.dateEncodingStrategy = .iso8601` once. `JSONFileStore` initializes `JSONEncoder` with no date strategy, relying on the default.

**Files to read first:**
- `ios-native/Sources/MeditationNativeCore/Services/JSONFileStore.swift` — lines 15–24 (encoder initialization)
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift` — find all `Date.iso8601(...)` calls and any manual date formatting
- Find where `Date.iso8601` is defined — likely a Date extension in Sources

**Changes:**

1. In `JSONFileStore.init`, set the date encoding strategy:
   ```swift
   public init(
     fileURL: URL,
     encoder: JSONEncoder = {
       let e = JSONEncoder()
       e.outputFormatting = [.prettyPrinted, .sortedKeys]
       e.dateEncodingStrategy = .iso8601
       return e
     }(),
     decoder: JSONDecoder = {
       let d = JSONDecoder()
       d.dateDecodingStrategy = .iso8601
       return d
     }()
   ) { ... }
   ```

2. In `AppSyncService.swift`, replace manual `Date.iso8601(dateString)` parsing calls with `ISO8601DateFormatter` or rely on the Codable path (if dates are Codable via the strategy above):
   - If dates are encoded/decoded as part of a `Codable` struct, the `.iso8601` strategy handles them automatically — remove the manual formatting calls.
   - If `Date.iso8601(...)` is called to parse a raw string from a non-Codable path, replace with:
     ```swift
     let formatter = ISO8601DateFormatter()
     guard let date = formatter.date(from: dateString) else {
         throw AppSyncError.invalidDate(dateString)
     }
     ```

3. Confirm that all existing tests still pass — `Codable` encoding/decoding of `Date` may change behavior if dates were previously encoded differently.

---

## I-M8: Replace silent audio error catches with os.Logger

**Problem:** `SystemSoundPlayer` and `SilentBackgroundAudioKeepAlive` catch errors and set `isActive = false` without logging. When an end bell fails in production, there is no trace in Console.app.

**Files to read first:**
- `ios-native/MeditationNative/App/SystemSupport.swift` — find all `catch { }` and `catch { isActive = false }` blocks in audio-related code
- Search for any `print(...)` calls that should be `os.Logger`

**Changes:**

1. Add a structured logger at the top of `SystemSupport.swift`:
   ```swift
   import os

   private let audioLogger = Logger(subsystem: "com.meditation.native", category: "audio")
   ```

2. Replace every silent `catch { }` or `catch { isActive = false }` in audio code with structured logging:
   ```swift
   // Before:
   catch {
       isActive = false
   }

   // After:
   catch {
       audioLogger.error("SilentBackgroundAudioKeepAlive failed to start: \(error.localizedDescription, privacy: .public)")
       isActive = false
   }
   ```

3. Log successful operations at `.debug` level:
   ```swift
   audioLogger.debug("SilentBackgroundAudioKeepAlive started successfully")
   audioLogger.debug("Audio session deactivated")
   ```

4. Replace `os_log("...", log: .default, type: .error, ...)` (old C-style API) with the new `Logger` API throughout the file for consistency.

5. Apply the same pattern to `SystemSoundPlayer` — find its error handling and add logging.

---

## I-M10: Release audio session lease on pause

**Problem:** `BundledCustomPlayAudioPlayer.pausePlayback()` (line 395–397 in `SystemSupport.swift`) simply calls `player?.pause()` without releasing `holdsPlaybackSessionLease`. Long pauses keep the audio session active, blocking other apps and draining battery.

**Files to read first:**
- `ios-native/MeditationNative/App/SystemSupport.swift` — lines 395–416 (`pausePlayback`, `resumePlayback`, `stopPlayback`)

**Changes:**

Update `pausePlayback` to release the lease, and `resumePlayback` to reacquire it:

```swift
func pausePlayback() {
    player?.pause()
    releasePlaybackSessionLeaseIfNeeded() // Release on pause
}

func resumePlayback() throws {
    guard let player else {
        throw LocalAudioPlaybackError.audioSetupFailed
    }
    // Always re-activate the session when resuming (may have been released on pause)
    try PlaybackAudioSessionSupport.activatePlaybackSession()
    holdsPlaybackSessionLease = true
    player.play()
}
```

Confirm that `releasePlaybackSessionLeaseIfNeeded()` only deactivates the session if no other component is using it (i.e., `PlaybackAudioSessionSupport` tracks active users). If deactivation is unconditional, add a use-count or check.

---

## I-L1: Verify [weak self] in deinit closures

**Problem:** `ShellViewModel.deinit` cancels `clockCancellable` (or equivalent timer) but relies on no retain cycles for the cancellation to reach deinit.

**Files to read first:**
- `ios-native/MeditationNative/App/ShellViewModel.swift` — find `deinit`; look for any stored `AnyCancellable` or `Task` properties
- Coordinator files from Session D — confirm each has a proper `deinit`

**Changes:**

1. In `deinit`, explicitly cancel any stored tasks:
   ```swift
   deinit {
       clockTask?.cancel()
       syncTask?.cancel()
       // Combine cancellables are cancelled automatically when Set is deallocated
   }
   ```

2. Add a test (in `ShellViewModelTests.swift`) that creates a `ShellViewModel` in a local scope and confirms it deallocates (using `weak var` + `XCTAssertNil` after scope exit):
   ```swift
   func testShellViewModelDeallocates() throws {
       weak var weakVM: ShellViewModel?
       autoreleasepool {
           let vm = ShellViewModel(...)
           weakVM = vm
           _ = vm // use it briefly
       }
       XCTAssertNil(weakVM, "ShellViewModel should deallocate when no strong references remain")
   }
   ```

---

## I-L2: Engine teardown before session deactivation in end()

**Problem:** `SilentBackgroundAudioKeepAlive.end()` calls `engine.pause()` then immediately `PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()`. The audio hardware may still be draining frames.

**Files to read first:**
- `ios-native/MeditationNative/App/SystemSupport.swift` — lines ~585–594 (`end()` method in `SilentBackgroundAudioKeepAlive`)

**Changes:**

Add a brief check before deactivating — stop the player node and stop (not pause) the engine, which flushes the buffer:
```swift
func end() {
    guard isActive else { return }
    playerNode.stop()        // Stop scheduling frames immediately
    engine.stop()            // Stop (not pause) — flushes audio hardware
    PlaybackAudioSessionSupport.deactivatePlaybackSessionIfNeeded()
    isActive = false
}
```

`engine.stop()` (vs `engine.pause()`) is the correct call for full teardown — `pause()` keeps the engine in a resumable state and may not flush promptly. If you need the engine to be quickly restartable, call `engine.stop()` then `engine.prepare()` in `begin()` to reinitialize it.

---

## I-L3: Bundled sound missing — assert and log

**Problem:** When a bundled sound file is not found (`Bundle.main.url(forResource:...) == nil`), the code returns silently. In DEBUG this should crash loudly; in RELEASE it should log.

**Files to read first:**
- Find where bundled sound URLs are resolved — likely in `SystemSoundPlayer` or a sound-file lookup helper in `SystemSupport.swift`

**Changes:**

```swift
func resolveSound(named name: String, extension ext: String) -> URL? {
    guard let url = Bundle.main.url(forResource: name, withExtension: ext) else {
        #if DEBUG
        assertionFailure("Bundled sound not found: \(name).\(ext) — check the app bundle")
        #else
        audioLogger.error("Bundled sound not found: \(name, privacy: .public).\(ext, privacy: .public)")
        #endif
        return nil
    }
    return url
}
```

All callers of this helper must handle `nil` gracefully (skip the bell rather than crashing).

---

## Verification

1. Build and run `swift test` from `ios-native/` — all Core package tests must pass.
2. Build and run `xcodebuild test` for the app target — `ShellViewModelTests` and presentation tests must pass.
3. In Xcode, enable the Memory Graph debugger and confirm `ShellViewModel` deallocates when its view is dismissed (I-L1 test).
4. Open Console.app, filter by subsystem `com.meditation.native`, category `audio` — confirm audio errors appear as structured logs rather than being swallowed.
5. Build in DEBUG mode and confirm no force-unwrap crashes occur during a full meditation session.

## After finishing

Commit on branch `review-fixes`:
```
fix(ios): audio safety, logging, lease release, and test hardening (I-H2, I-H7, I-M3, I-M4, I-M8, I-M10, I-L1, I-L2, I-L3)
```
