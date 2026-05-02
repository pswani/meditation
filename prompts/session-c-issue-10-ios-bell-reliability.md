# Session C — Issue #10: iOS bell reliability

## Context

This is a meditation app with a Spring Boot backend, React/TypeScript web client, and a Swift iOS client.
We are working on branch `review-fixes`. Issues #1–#5, #7–#9 are already done and committed.

The fix plan lives at `docs/fix-plan-top10-2026-04-24.md` (Issue #10 section).
The full defect context lives at `EXECPLAN-ios-native-bell-reliability.md`.

## Problem

The end bell (sound signalling session completion) is unreliable in the background. Four root causes:

| ID | Problem |
|----|---------|
| I-H2 | Strong `self` captures in `Task { }` blocks inside `ShellViewModel` — retain cycles, tasks fire on a deallocated context |
| I-H3 | `shouldKeepBackgroundAudioAlive` only activates keepalive for some bell-emitting conditions; a custom play *with* a recording does not trigger it, so the audio session deactivates before the end bell fires |
| I-H4 | No `AVAudioSession.interruptionNotification` handling — a phone call or Siri interruption drops the session without recovery |
| I-H6 | `setActive(false)` called without `.notifyOthersOnDeactivation` — ducked background audio from other apps is never restored |

(I-H1 wall-clock timer is addressed by Issue #5 / Session A.)

## Files to read first

1. `ios-native/MeditationNative/App/ShellViewModel.swift` — all `Task { }` blocks, `shouldKeepBackgroundAudioAlive`, clock/timer logic
2. `ios-native/MeditationNative/App/SystemSupport.swift` — `SystemSoundPlayer`, `BundledCustomPlayAudioPlayer`, `SilentBackgroundAudioKeepAlive`, all `setActive` calls

Read both files fully before making any changes.

## Changes

### I-H2 — Weak self in Task captures

1. Search `ShellViewModel.swift` for every `Task {` and `Task { @MainActor in` block.
2. Annotate each with `[weak self]`: `Task { [weak self] in` or `Task { [weak self] @MainActor in`.
3. Inside each task body, add `guard let self else { return }` before any `self.` usage.
4. Where the task produces a result needed by the caller, prefer `async let` or structured concurrency over unstructured `Task { }`.

### I-H3 — Keepalive coverage

1. Locate `shouldKeepBackgroundAudioAlive(for:)` in `ShellViewModel.swift`.
2. The current logic activates keepalive only for specific timer states. Expand the condition:
   - Keepalive is active for the **entire duration** of any running session where at least one of the following is true: end bell is enabled, interval bell is enabled, a recording with an end bell is in use.
   - Deactivate keepalive only after the session fully ends and all scheduled bells have fired.
3. This is the safest option — slight battery cost during the session, but no missed bells.

### I-H4 — Interruption handling

In `SystemSupport.swift`, add interruption handling to each audio player class (`SystemSoundPlayer`, `BundledCustomPlayAudioPlayer`, `SilentBackgroundAudioKeepAlive`):

```swift
NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
    .sink { [weak self] notification in
        guard let type = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let interruptionType = AVAudioSession.InterruptionType(rawValue: type) else { return }
        switch interruptionType {
        case .began:
            self?.isActive = false
        case .ended:
            let shouldResume = (notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt)
                .flatMap(AVAudioSession.InterruptionOptions.init(rawValue:))
                .map { $0.contains(.shouldResume) } ?? false
            if shouldResume { self?.resume() }
        @unknown default: break
        }
    }
    .store(in: &cancellables)
```

Store the `cancellables` set in each class if not already present. Cancel in `deinit` / `stopPlayback()`.

### I-H6 — Deactivate notifying others

1. Audit all paths in `SystemSupport.swift` that call `AVAudioSession.sharedInstance().setActive(false, ...)` or equivalent.
2. Replace plain `setActive(false)` with:
   ```swift
   do {
       try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
   } catch {
       os_log("Audio session deactivation failed: %{public}@", log: .default, type: .error, error.localizedDescription)
   }
   ```
3. Apply this in `stopPlayback()`, session completion, and interruption teardown paths.

## Verification

- Run the iOS test suite — `ShellViewModelTests`, `ShellViewModelPresentationTests` must all pass.
- I-H2: after adding `[weak self]`, confirm no crashes under rapid session start/stop.
- I-H3: unit test `shouldKeepBackgroundAudioAlive` — given a custom play with a recording AND end bell enabled, assert it returns `true`.
- I-H4: `XCTest` using `NotificationCenter.default.post(name: AVAudioSession.interruptionNotification, ...)` — assert player state transitions correctly.
- I-H6: manual test — start a session with background music playing; complete the session; confirm background music volume returns to normal within a few seconds.
- End-to-end bell test: lock screen with an active 2-minute timer; verify the bell fires at completion.

## After finishing

Commit on branch `review-fixes` and push.
