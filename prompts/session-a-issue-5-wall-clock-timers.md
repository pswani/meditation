# Session A — Issue #5: Wall-clock timers (web + iOS)

## Context

This is a meditation app with a Spring Boot backend, React/TypeScript web client, and a Swift iOS client.
We are working on branch `review-fixes`. Issues #1–#4, #7, #9, #2, #3 are already done and committed.

The fix plan lives at `docs/fix-plan-top10-2026-04-24.md` (Issue #5 section).

## Problem

Both the web and iOS clients compute elapsed session time from wall-clock timestamps. Wall-clock time is not monotonic:
- NTP corrections can move `Date.now()` backward mid-session, making elapsed time decrease or stall.
- On iOS, `Timer.publish(every: 1, on: .main)` misses ticks under main-thread load or app backgrounding.

## Web changes

**Goal:** use `performance.now()` (monotonic within a browsing context) for within-session elapsed calculation. Keep `Date.now()` for log timestamps and display labels only.

**Files to read first:**
- `src/types/timer.ts` — find the `ActiveSession` type
- `src/features/timer/time.ts` — find `getActiveSessionElapsedSeconds` and `getActiveSessionElapsedMilliseconds`
- `src/features/timer/timerReducer.ts` — find all places that set `lastResumedAtMs`
- `src/features/timer/TimerContext.tsx` — find callers of the elapsed helpers
- `src/features/timer/time.test.ts` — understand existing test coverage

**Changes:**

1. In `ActiveSession` (`src/types/timer.ts`): add `readonly lastResumedAtPerformanceMs: number | null`.

2. In `timerReducer.ts`: wherever `lastResumedAtMs: Date.now()` is set on a RESUME action, also set `lastResumedAtPerformanceMs: performance.now()`. On PAUSE / STOP, set `lastResumedAtPerformanceMs: null`.

3. In `time.ts`: update `getActiveSessionElapsedSeconds` and `getActiveSessionElapsedMilliseconds` to accept a second parameter `nowPerformanceMs: number` and compute elapsed using `nowPerformanceMs - session.lastResumedAtPerformanceMs` when `lastResumedAtPerformanceMs` is non-null. Fall back to the existing wall-clock path when it is null (covers restored sessions before the field existed).

4. In `TimerContext.tsx`: update all call sites of the elapsed helpers to pass `performance.now()`.

5. In `time.test.ts`: add tests that pass separate wall-clock and performance-clock values. Verify that a backward wall-clock adjustment with a stable performance clock produces stable elapsed. Verify that pausing freezes elapsed and resuming continues from the frozen value. Mock `performance.now()` via `vi.stubGlobal('performance', { now: () => <value> })`.

## iOS changes

**Goal:** replace `Timer.publish(every: 1, on: .main)` with a background `DispatchSourceTimer` and use `ContinuousClock` (monotonic, iOS 16+) for elapsed accounting.

**Files to read first:**
- `ios-native/MeditationNative/App/ShellViewModel.swift` — find the `Timer.publish` / `clockCancellable` block and the session resume logic

**Changes in `ShellViewModel.swift`:**

1. Remove the `clockCancellable` sink that drives ticks via `Timer.publish`.

2. Add `private var clockTimer: DispatchSourceTimer?` property.

3. Add `private var sessionResumedAt: ContinuousClock.Instant?` property.

4. In the clock-start method, create:
   ```swift
   let timer = DispatchSource.makeTimerSource(queue: .global(qos: .userInteractive))
   timer.schedule(deadline: .now(), repeating: .milliseconds(200), leeway: .milliseconds(50))
   timer.setEventHandler { [weak self] in
       Task { @MainActor [weak self] in
           guard let self else { return }
           self.now = Date()
           self.tickSession()
       }
   }
   timer.resume()
   self.clockTimer = timer
   ```

5. When a session is started or resumed, record `sessionResumedAt = ContinuousClock().now`. Compute elapsed as `ContinuousClock().now - sessionResumedAt` instead of subtracting `Date` values.

6. Keep `Date()` for display strings and for the `endedAt` field written to `AppSnapshot`.

7. Cancel `clockTimer` in `deinit` and in `stopSession()` / `pauseSession()`.

## Verification

- Run `npm test` in the repo root — all existing web tests must pass plus the new time.test.ts cases.
- Run the iOS test suite (`xcodebuild test` or Xcode) — `ShellViewModelTests` must pass.
- Confirm via a manual smoke test: start a timer session, lock the screen for 30 seconds, unlock — elapsed should be accurate and not stalled.

## After finishing

Commit both changes together (or as two commits — one web, one iOS) on branch `review-fixes` and push.
