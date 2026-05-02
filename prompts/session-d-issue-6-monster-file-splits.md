# Session D — Issue #6: Monster file splits (multi-sprint)

## Context

This is a meditation app with a Spring Boot backend, React/TypeScript web client, and a Swift iOS client.
We are working on branch `review-fixes` (or a new branch cut from it after earlier sessions are merged).

**Prerequisite:** Issue #10 (Session C) must be merged before starting the iOS coordinator extraction, because both touch `ShellViewModel.swift`.

The fix plan lives at `docs/fix-plan-top10-2026-04-24.md` (Issue #6 section).

## Problem

Three files have grown into unmanageable monoliths:

| File | Lines | Mixed concerns |
|------|-------|----------------|
| `src/features/timer/TimerContext.tsx` | ~1,372 | Timer, custom play, playlist, session log, hydration, audio wiring, visibility handlers |
| `src/features/timer/useTimerSyncEffects.ts` | ~822 | Hydration + reconciliation for 4 entity types, ~18 dedup refs |
| `ios-native/MeditationNative/App/ShellViewModel.swift` | ~1,678 | Persistence, sync, timer SM, custom play SM, playlist SM, notifications, audio delegation |

## Recommended execution order

Do one domain at a time. Run `npm test` after each step. Never attempt the full split in one session.

---

## Part 1 — Split `TimerContext.tsx` (web)

**Files to read first:**
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerContextObject.ts` (or equivalent — the object that assembles context value)
- `src/features/timer/useTimerSyncEffects.ts`

**Proposed domain contexts (create as new files, one per domain):**

| New file | Responsibility |
|----------|---------------|
| `src/features/timer/timerStateContext.ts` | Exposes reducer `state` and `dispatch` |
| `src/features/timer/timerActionsContext.ts` | Stable `useCallback`-memoized dispatch helpers (start, pause, stop, etc.) |
| `src/features/timer/customPlayContext.ts` | Custom play collection state + active-run state |
| `src/features/timer/playlistRuntimeContext.ts` | Playlist collection + active-playlist-run state |
| `src/features/timer/sessionLogContext.ts` | Session log list, save, manual log operations |
| `src/features/timer/timerSettingsContext.ts` | Settings load/save only |

**Execution steps:**

1. **Agree on the API surface.** Before touching any code, write the TypeScript interface for each new context value and review it. Only proceed once the interfaces look right.

2. **Create empty providers** that re-export the same values as the monolith (no functional change). Run `npm test` — must still pass.

3. **Move one domain at a time**, in this order (fewest cross-domain dependencies first):
   - `SessionLogContext` → `CustomPlayContext` → `PlaylistRuntimeContext` → `TimerSettingsContext` → `TimerActionsContext` → `TimerStateContext`
   - Run `npm test` after each domain is moved.

4. **Update all consumers** of `useTimerContext()` to import from the new domain-specific hooks.

5. `TimerContext.tsx` becomes a thin `TimerProvider` that composes the domain providers — it should shrink to ~50 lines.

---

## Part 2 — Extract hydration factory from `useTimerSyncEffects.ts` (web)

Do this **after** Part 1 is complete so the factory can import from the finalized domain contexts.

**Goal:** extract a `createCollectionHydrator<T>` (or `useCollectionHydrator`) factory that handles the four near-identical hydration blocks (customPlays, playlists, sessionLogs, timerSettings).

**New file:** `src/features/timer/useCollectionHydrator.ts`

**Factory interface (approximate):**
```typescript
interface CollectionHydratorOptions<T> {
  storageLoader: () => T[];
  apiLoader: () => Promise<T[]>;
  reducer: { toAction: (items: T[]) => TimerAction };
  queueReconciler?: (storedItems: T[], apiItems: T[]) => SyncQueueEntry[];
  dedupeRef: React.MutableRefObject<Set<string>>;
}
```

Each of the four hydration blocks in `useTimerSyncEffects.ts` becomes one `useCollectionHydrator(...)` call. The file should shrink from ~822 lines to ~200.

---

## Part 3 — Extract session coordinators from `ShellViewModel.swift` (iOS)

Do this **after Issue #10 (Session C) is merged** — both sessions touch `ShellViewModel.swift`.

**Files to read first:**
- `ios-native/MeditationNative/App/ShellViewModel.swift` (after #10 changes)

**New files to create:**

| New file | Owns |
|----------|------|
| `ios-native/MeditationNative/App/PlaylistSessionCoordinator.swift` | `ActivePlaylistSession?`, per-item playback, item advancement |
| `ios-native/MeditationNative/App/CustomPlaySessionCoordinator.swift` | `ActiveCustomPlaySession?`, audio player, completion |
| `ios-native/MeditationNative/App/TimerSessionCoordinator.swift` | `ActiveTimerSession?`, clock, bells, background keepalive |

**Execution steps:**

1. Extract `PlaylistSessionCoordinator` first (most isolated).
2. Then `CustomPlaySessionCoordinator`.
3. Then `TimerSessionCoordinator` last (most complex — owns bell and keepalive logic).

After extraction, `ShellViewModel` is a thin `@Observable @MainActor` object that:
- Holds references to the three coordinators.
- Exposes `@Published` properties mirroring coordinator state for SwiftUI.
- Delegates all domain logic to the coordinator.
- Retains sync and persistence concerns.

Run `ShellViewModelTests` and `ShellViewModelPresentationTests` after each coordinator is extracted.

---

## Verification

- `npm test` passes after every Part 1 step and after Part 2.
- After Part 1, add a test that a change to `customPlayContext` value does NOT cause re-renders in a `timerStateContext`-only consumer (use a render-count spy or `React.memo` with a counter).
- After Part 3, run `xcodebuild test` — all iOS tests pass.

## After each part

Commit separately (one commit per coordinator or domain migration). Push to `review-fixes` (or a dedicated branch if preferred for review).
