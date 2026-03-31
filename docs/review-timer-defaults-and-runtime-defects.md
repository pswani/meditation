# Timer Defaults And Runtime Defects Review

## Summary
The defect-remediation bundle has materially improved timer trustworthiness: Practice no longer overwrites saved defaults, active-session recovery is much cleaner, and the latest validation/logging pass tightened several edge cases. No critical issues were identified in this review. The most important follow-up work is now in timer-settings sync safety, where the online hydration path can still let stale local state win too easily and can refresh queued mutation timestamps in a way that weakens stale-write protection.

## Critical issues
- None.

## Important issues

### 1. Online timer-settings hydration can silently promote stale local cache over authoritative backend state
- Where it appears:
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L846)
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L910)
- Why it is a problem:
  - When the backend response happens to equal `defaultTimerSettings`, the hydration logic treats any non-default local settings as something to preserve, even if there is no queued timer-settings mutation proving the local browser state is unsynced user intent.
  - That means a stale browser cache from an older session or device can survive online hydration and then be re-queued back to the backend without any new user action.
  - The risk is highest when the backend legitimately still uses the app defaults, because that is exactly the case where the local cache is currently allowed to win.
- Recommended fix:
  - Stop using “remote equals app defaults” as a proxy for unsynced local intent.
  - Prefer backend timer settings unless there is an actual queued timer-settings mutation or another explicit locally-dirty marker that proves the browser has newer unsynced state.

### 2. Timer-settings queue reconciliation refreshes queued write metadata and bypasses normalization for queued payloads
- Where it appears:
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L281)
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L906)
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L993)
  - [src/utils/syncQueue.ts](/Users/prashantwani/wrk/meditation/src/utils/syncQueue.ts#L127)
- Why it is a problem:
  - The timer-settings effect always re-enqueues `state.settings` whenever it differs from `lastPersistedTimerSettingsRef`, even if an equivalent timer-settings write is already sitting in the queue.
  - `enqueueSyncQueueEntry` replaces the existing entry for that record id, which means the original `queuedAt` timestamp is lost and replaced with a newer one.
  - The backend uses that queued timestamp for stale-write protection, so an older offline timer-settings change can look newer than it really is after a reload or hydration cycle.
  - At the same time, `applyQueuedTimerSettings` returns raw queued payloads without passing them through the new timer-settings normalization helper, so legacy queued payloads remain the one timer-settings hydration path that can still bypass the prompt 03 compatibility cleanup.
- Recommended fix:
  - Before enqueuing timer settings, compare against the latest queued timer-settings payload and keep the existing queue entry when the meaning is unchanged.
  - Preserve the original `queuedAt` for timer-settings entries that are still representing the same unsynced user change.
  - Normalize queued timer-settings payloads with the same helper used for API and local-storage timer settings before dispatching them back into runtime state.

## Nice-to-have improvements

### 1. Home quick start still collapses paused and running timers into the same label
- Where it appears:
  - [src/pages/HomePage.tsx](/Users/prashantwani/wrk/meditation/src/pages/HomePage.tsx#L143)
- Why it is a problem:
  - The app shell now distinguishes paused timers from active running timers, but Home still labels both states as “Resume Active Timer.”
  - That inconsistency is small, yet it is most noticeable right after the recovery/pause improvements in this milestone because the Home surface is one of the first places the user returns to.
- Recommended fix:
  - Make the Home quick-start button label follow `activeSession.isPaused`, mirroring the paused-specific wording already used in the shell banner.

### 2. `TimerContext` is still carrying too many timer-adjacent responsibilities in one provider
- Where it appears:
  - [src/features/timer/TimerContext.tsx](/Users/prashantwani/wrk/meditation/src/features/timer/TimerContext.tsx#L292)
- Why it is a problem:
  - The provider is now 1742 lines long and mixes timer defaults, active-session recovery, sound playback, session-log sync, custom plays, playlists, queue flushing, and multiple hydration flows.
  - The current code works, but the density makes timer-specific defects harder to review in isolation and increases the chance that future “small” timer fixes will accidentally disturb unrelated offline or playlist behavior.
- Recommended fix:
  - Extract one or two focused submodules next time this area is touched for real behavior work, starting with timer-settings hydration/sync or active-session runtime/recovery, so the timer state model becomes easier to reason about and test independently.
